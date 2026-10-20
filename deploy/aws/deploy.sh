#!/usr/bin/env bash
# Deploys the Vandelay APIs to AWS: ECR image -> App Runner (public HTTPS) -> private RDS Postgres.
#
#   TOKENS_FILE=~/Desktop/vandelay-api-tokens.txt AWS_PROFILE=<profile> ./deploy/aws/deploy.sh
#
# Creates (all tagged Project=vandelay-demo, safe to re-run):
#   - ECR repository, IAM roles, Secrets Manager secrets (tokens + DB password; nothing is stored in the image)
#   - Security groups, RDS PostgreSQL db.t4g.micro (private; databases vandelay_prod and vandelay_test)
#   - App Runner services vandelay-prod and vandelay-test (public, autoscaling capped) behind a VPC connector
#   - A WAF web ACL with a per-IP rate limit, attached to both services
# Remove everything with deploy/aws/teardown.sh.
set -euo pipefail

: "${TOKENS_FILE:?Set TOKENS_FILE to the file holding the '# PROD' and '# TEST' token sections}"
export AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}"
REGION="$AWS_DEFAULT_REGION"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
P=vandelay
TAGS_EC2="Key=Project,Value=vandelay-demo"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d%H%M%S)}"
ECR="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$P-apis"
CPU="${APP_CPU:-512}" MEMORY="${APP_MEMORY:-1024}" MAX_INSTANCES="${MAX_INSTANCES:-3}"
WAF_IP_LIMIT="${WAF_IP_LIMIT:-1200}"   # requests per minute per client IP before WAF blocks

step() { printf '\n==> %s\n' "$*"; }
tok() { awk -F= -v sec="# $1" -v k="$2" '$0==sec{f=1;next} /^# /{f=0} f&&$1==k{print substr($0,index($0,"=")+1)}' "$TOKENS_FILE"; }

step "Account $ACCOUNT, region $REGION"

# ---- Secrets Manager -------------------------------------------------------------------------------
put_secret() { # name value -> prints ARN
  local name="$1" value="$2"
  if aws secretsmanager describe-secret --secret-id "$name" >/dev/null 2>&1; then
    aws secretsmanager put-secret-value --secret-id "$name" --secret-string "$value" >/dev/null
  else
    aws secretsmanager create-secret --name "$name" --secret-string "$value" --tags Key=Project,Value=vandelay-demo >/dev/null
  fi
  aws secretsmanager describe-secret --secret-id "$name" --query ARN --output text
}
secret_arn() { aws secretsmanager describe-secret --secret-id "$1" --query ARN --output text 2>/dev/null; }

step "Secrets"
DB_SECRET="$P/db-password"
if ! secret_arn "$DB_SECRET" >/dev/null; then put_secret "$DB_SECRET" "$(openssl rand -hex 24)" >/dev/null; fi
DB_PASSWORD="$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET" --query SecretString --output text)"
for env in prod test; do
  upper="$(echo "$env" | tr a-z A-Z)"
  for name in API_TOKEN_AGENT API_TOKEN_ADJUSTER API_TOKEN_SUPERVISOR API_TOKEN_CUSTOMER; do
    value="$(tok "$upper" "$name")"
    [ -n "$value" ] || { echo "Missing $name in the $upper section of $TOKENS_FILE" >&2; exit 1; }
    printf -v "SECRET_ARN_${env}_${name}" '%s' "$(put_secret "$P/$env/$name" "$value")"
  done
done
admin="$(tok TEST ADMIN_TOKEN)"; [ -n "$admin" ] || { echo "Missing ADMIN_TOKEN in the TEST section" >&2; exit 1; }
SECRET_ARN_test_ADMIN_TOKEN="$(put_secret "$P/test/ADMIN_TOKEN" "$admin")"
DB_SECRET_ARN="$(secret_arn "$DB_SECRET")"

# ---- Network ---------------------------------------------------------------------------------------
step "Network (default VPC)"
VPC="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
[ "$VPC" != None ] || { echo "No default VPC in $REGION" >&2; exit 1; }
SUBNETS=($(aws ec2 describe-subnets --filters Name=vpc-id,Values="$VPC" Name=default-for-az,Values=true --query 'Subnets[].SubnetId' --output text))
[ "${#SUBNETS[@]}" -ge 2 ] || { echo "Need at least two subnets in the default VPC" >&2; exit 1; }

sg() { # name description -> id
  local id
  id="$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC" Name=group-name,Values="$1" --query 'SecurityGroups[0].GroupId' --output text)"
  if [ "$id" = None ]; then
    id="$(aws ec2 create-security-group --group-name "$1" --description "$2" --vpc-id "$VPC" \
      --tag-specifications "ResourceType=security-group,Tags=[{$TAGS_EC2}]" --query GroupId --output text)"
  fi
  echo "$id"
}
APP_SG="$(sg $P-apprunner 'Vandelay App Runner egress')"
DB_SG="$(sg $P-db 'Vandelay RDS: Postgres from App Runner only')"
aws ec2 authorize-security-group-ingress --group-id "$DB_SG" --protocol tcp --port 5432 --source-group "$APP_SG" >/dev/null 2>&1 || true

# ---- RDS -------------------------------------------------------------------------------------------
step "RDS PostgreSQL (private)"
aws rds describe-db-subnet-groups --db-subnet-group-name $P-db >/dev/null 2>&1 || \
  aws rds create-db-subnet-group --db-subnet-group-name $P-db --db-subnet-group-description "Vandelay DB" \
    --subnet-ids "${SUBNETS[@]}" --tags Key=Project,Value=vandelay-demo >/dev/null
if ! aws rds describe-db-instances --db-instance-identifier $P-db >/dev/null 2>&1; then
  aws rds create-db-instance --db-instance-identifier $P-db --engine postgres --engine-version "${PG_VERSION:-17}" \
    --db-instance-class db.t4g.micro --allocated-storage 20 --storage-type gp3 --storage-encrypted \
    --master-username $P --master-user-password "$DB_PASSWORD" --db-subnet-group-name $P-db \
    --vpc-security-group-ids "$DB_SG" --no-publicly-accessible --no-multi-az --backup-retention-period 1 \
    --auto-minor-version-upgrade --tags Key=Project,Value=vandelay-demo >/dev/null
fi
echo "Waiting for the database (about 10 minutes the first time)..."
aws rds wait db-instance-available --db-instance-identifier $P-db
DB_HOST="$(aws rds describe-db-instances --db-instance-identifier $P-db --query 'DBInstances[0].Endpoint.Address' --output text)"

# ---- IAM -------------------------------------------------------------------------------------------
step "IAM roles for App Runner"
role() { # name trust-service -> arn
  aws iam get-role --role-name "$1" >/dev/null 2>&1 || aws iam create-role --role-name "$1" --tags Key=Project,Value=vandelay-demo \
    --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"$2\"},\"Action\":\"sts:AssumeRole\"}]}" >/dev/null
  aws iam get-role --role-name "$1" --query Role.Arn --output text
}
ACCESS_ROLE="$(role $P-apprunner-ecr build.apprunner.amazonaws.com)"
aws iam attach-role-policy --role-name $P-apprunner-ecr --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
INSTANCE_ROLE="$(role $P-apprunner-instance tasks.apprunner.amazonaws.com)"
aws iam put-role-policy --role-name $P-apprunner-instance --policy-name read-vandelay-secrets --policy-document \
  "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":\"secretsmanager:GetSecretValue\",\"Resource\":\"arn:aws:secretsmanager:$REGION:$ACCOUNT:secret:$P/*\"}]}"
echo "Waiting for IAM propagation..."; sleep 15

# ---- Image -----------------------------------------------------------------------------------------
step "Build (linux/amd64) and push $ECR:$IMAGE_TAG"
aws ecr describe-repositories --repository-names $P-apis >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name $P-apis --image-scanning-configuration scanOnPush=true --tags Key=Project,Value=vandelay-demo >/dev/null
aws ecr get-login-password | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com" >/dev/null
docker buildx build --platform linux/amd64 -t "$ECR:$IMAGE_TAG" --push "$ROOT"

# ---- App Runner ------------------------------------------------------------------------------------
step "App Runner VPC connector and autoscaling"
VPC_CONNECTOR="$(aws apprunner list-vpc-connectors --query "VpcConnectors[?VpcConnectorName=='$P' && Status=='ACTIVE'].VpcConnectorArn | [0]" --output text)"
if [ "$VPC_CONNECTOR" = None ]; then
  # Some availability zones (e.g. use1-az3) don't support App Runner; drop any subnet AWS rejects and retry.
  CONNECTOR_SUBNETS=("${SUBNETS[@]}")
  for _ in 1 2 3 4 5 6; do
    if out="$(aws apprunner create-vpc-connector --vpc-connector-name $P --subnets "${CONNECTOR_SUBNETS[@]}" --security-groups "$APP_SG" \
        --tags Key=Project,Value=vandelay-demo --query VpcConnector.VpcConnectorArn --output text 2>&1)"; then
      VPC_CONNECTOR="$out"; break
    fi
    bad="$(echo "$out" | grep -oE 'subnet-[0-9a-f]+' | head -1)"
    [ -n "$bad" ] || { echo "$out" >&2; exit 1; }
    echo "Skipping $bad (availability zone not supported by App Runner)"
    NEW=(); for sn in "${CONNECTOR_SUBNETS[@]}"; do [ "$sn" = "$bad" ] || NEW+=("$sn"); done
    CONNECTOR_SUBNETS=("${NEW[@]}")
    [ "${#CONNECTOR_SUBNETS[@]}" -ge 2 ] || { echo "Fewer than two App Runner-compatible subnets" >&2; exit 1; }
  done
  [ "$VPC_CONNECTOR" != None ] || { echo "Could not create the VPC connector" >&2; exit 1; }
fi
AUTOSCALING="$(aws apprunner list-auto-scaling-configurations --auto-scaling-configuration-name $P --query 'AutoScalingConfigurationSummaryList[0].AutoScalingConfigurationArn' --output text)"
if [ "$AUTOSCALING" = None ]; then
  AUTOSCALING="$(aws apprunner create-auto-scaling-configuration --auto-scaling-configuration-name $P --max-concurrency 100 \
    --min-size 1 --max-size "$MAX_INSTANCES" --tags Key=Project,Value=vandelay-demo --query AutoScalingConfiguration.AutoScalingConfigurationArn --output text)"
fi

service_json() { # env -> json on stdout
  local env="$1" appenv db secrets
  if [ "$env" = prod ]; then appenv=production; else appenv=test; fi
  db="${P}_$env"
  secrets="\"POSTGRES_PASSWORD\":\"$DB_SECRET_ARN\""
  for name in API_TOKEN_AGENT API_TOKEN_ADJUSTER API_TOKEN_SUPERVISOR API_TOKEN_CUSTOMER; do
    var="SECRET_ARN_${env}_${name}"; secrets="$secrets,\"$name\":\"${!var}\""
  done
  if [ "$env" = test ]; then secrets="$secrets,\"ADMIN_TOKEN\":\"$SECRET_ARN_test_ADMIN_TOKEN\""; fi
  cat <<JSON
{
  "ServiceName": "$P-$env",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR:$IMAGE_TAG",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "PORT": "8080", "APP_ENV": "$appenv", "POSTGRES_HOST": "$DB_HOST", "POSTGRES_PORT": "5432", "POSTGRES_USER": "$P",
          "POSTGRES_DB": "$db", "POSTGRES_SSL": "true", "POSTGRES_CREATE_DB": "true"
        },
        "RuntimeEnvironmentSecrets": { $secrets }
      }
    },
    "AuthenticationConfiguration": { "AccessRoleArn": "$ACCESS_ROLE" },
    "AutoDeploymentsEnabled": false
  },
  "InstanceConfiguration": { "Cpu": "$CPU", "Memory": "$MEMORY", "InstanceRoleArn": "$INSTANCE_ROLE" },
  "HealthCheckConfiguration": { "Protocol": "HTTP", "Path": "/health", "Interval": 10, "Timeout": 5, "HealthyThreshold": 1, "UnhealthyThreshold": 10 },
  "NetworkConfiguration": {
    "EgressConfiguration": { "EgressType": "VPC", "VpcConnectorArn": "$VPC_CONNECTOR" },
    "IngressConfiguration": { "IsPubliclyAccessible": true }
  },
  "AutoScalingConfigurationArn": "$AUTOSCALING",
  "Tags": [{ "Key": "Project", "Value": "vandelay-demo" }]
}
JSON
}

for env in prod test; do
  step "App Runner service $P-$env"
  arn="$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P-$env'].ServiceArn | [0]" --output text)"
  f="$(mktemp)"; service_json "$env" > "$f"
  if [ "$arn" = None ]; then
    arn="$(aws apprunner create-service --cli-input-json "file://$f" --query Service.ServiceArn --output text)"
  else
    # Redeploy: point the existing service at the new image tag (settings/secrets stay as created).
    aws apprunner update-service --service-arn "$arn" --source-configuration "$(python3 -c "import json,sys; print(json.dumps(json.load(open('$f'))['SourceConfiguration']))")" >/dev/null
  fi
  rm -f "$f"
  printf -v "SERVICE_ARN_${env}" '%s' "$arn"
done

wait_running() { # arn
  # After an update the service can still report RUNNING for a few seconds; give it time to start rolling out.
  for _ in $(seq 1 12); do
    [ "$(aws apprunner describe-service --service-arn "$1" --query Service.Status --output text)" != RUNNING ] && break
    sleep 5
  done
  for _ in $(seq 1 90); do
    status="$(aws apprunner describe-service --service-arn "$1" --query Service.Status --output text)"
    case "$status" in RUNNING) return 0 ;; CREATE_FAILED|DELETE_FAILED|OPERATION_FAILED) echo "Service status: $status" >&2; return 1 ;; esac
    sleep 10
  done
  echo "Timed out waiting for $1" >&2; return 1
}
for env in prod test; do var="SERVICE_ARN_$env"; step "Waiting for $P-$env to be RUNNING"; wait_running "${!var}"; done

# ---- WAF rate limit --------------------------------------------------------------------------------
step "WAF web ACL (per-IP rate limit: $WAF_IP_LIMIT requests/minute)"
WAF_ARN="$(aws wafv2 list-web-acls --scope REGIONAL --query "WebACLs[?Name=='$P-rate-limit'].ARN | [0]" --output text)"
if [ "$WAF_ARN" = None ]; then
  WAF_ARN="$(aws wafv2 create-web-acl --name $P-rate-limit --scope REGIONAL --default-action Allow={} \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=$P-rate-limit \
    --tags Key=Project,Value=vandelay-demo \
    --rules "[{\"Name\":\"per-ip-rate-limit\",\"Priority\":0,\"Action\":{\"Block\":{\"CustomResponse\":{\"ResponseCode\":429}}},\"Statement\":{\"RateBasedStatement\":{\"Limit\":$WAF_IP_LIMIT,\"EvaluationWindowSec\":60,\"AggregateKeyType\":\"IP\"}},\"VisibilityConfig\":{\"SampledRequestsEnabled\":true,\"CloudWatchMetricsEnabled\":true,\"MetricName\":\"$P-per-ip-rate-limit\"}}]" \
    --query Summary.ARN --output text)"
fi
for env in prod test; do
  var="SERVICE_ARN_$env"
  # A web ACL created seconds ago can briefly be "unavailable"; retry until it propagates.
  for attempt in 1 2 3 4 5 6 7 8; do
    aws wafv2 associate-web-acl --web-acl-arn "$WAF_ARN" --resource-arn "${!var}" >/dev/null 2>&1 && break
    [ "$attempt" -lt 8 ] || { echo "Could not attach the WAF web ACL to $P-$env" >&2; exit 1; }
    sleep 10
  done
done

# ---- Result ----------------------------------------------------------------------------------------
step "Done"
for env in prod test; do
  var="SERVICE_ARN_$env"; url="$(aws apprunner describe-service --service-arn "${!var}" --query Service.ServiceUrl --output text)"
  echo "$env: https://$url"
done
