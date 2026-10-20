#!/usr/bin/env bash
# Deploys the Vandelay Claims MCP server to AWS App Runner, in front of the APIs that deploy.sh created.
#
#   AWS_PROFILE=<profile> ./deploy/aws/deploy-mcp.sh
#
# Run deploy.sh first: this reuses its ECR access role, instance role, persona-token secrets (vandelay/<env>/API_TOKEN_*),
# and WAF web ACL, and points each MCP service (vandelay-mcp-prod, vandelay-mcp-test) at the matching API service.
# The MCP server needs no database and no VPC connector. Remove it with teardown.sh (it also removes the MCP resources).
set -euo pipefail

export AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}"
REGION="$AWS_DEFAULT_REGION"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
P=vandelay
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d%H%M%S)}"
ECR="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/$P-mcp"
CPU="${MCP_CPU:-256}" MEMORY="${MCP_MEMORY:-512}" MAX_INSTANCES="${MAX_INSTANCES:-3}"
ADJUSTER_APPROVAL_LIMIT="${ADJUSTER_APPROVAL_LIMIT:-15000}"

step() { printf '\n==> %s\n' "$*"; }
secret_arn() { aws secretsmanager describe-secret --secret-id "$1" --query ARN --output text 2>/dev/null; }

step "Account $ACCOUNT, region $REGION"

# ---- Prerequisites created by deploy.sh ------------------------------------------------------------
ACCESS_ROLE="$(aws iam get-role --role-name $P-apprunner-ecr --query Role.Arn --output text 2>/dev/null || true)"
INSTANCE_ROLE="$(aws iam get-role --role-name $P-apprunner-instance --query Role.Arn --output text 2>/dev/null || true)"
[ -n "$ACCESS_ROLE" ] && [ -n "$INSTANCE_ROLE" ] || { echo "Run deploy/aws/deploy.sh first (the App Runner IAM roles do not exist)." >&2; exit 1; }
AUTOSCALING="$(aws apprunner list-auto-scaling-configurations --auto-scaling-configuration-name $P --query 'AutoScalingConfigurationSummaryList[0].AutoScalingConfigurationArn' --output text)"
[ "$AUTOSCALING" != None ] || { echo "Run deploy/aws/deploy.sh first (no autoscaling configuration)." >&2; exit 1; }

for env in prod test; do
  url="$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P-$env'].ServiceUrl | [0]" --output text)"
  [ "$url" != None ] || { echo "The $P-$env API service does not exist. Run deploy/aws/deploy.sh first." >&2; exit 1; }
  printf -v "API_URL_${env}" '%s' "https://$url"
done

# ---- Image -----------------------------------------------------------------------------------------
step "Build (linux/amd64) and push $ECR:$IMAGE_TAG"
aws ecr describe-repositories --repository-names $P-mcp >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name $P-mcp --image-scanning-configuration scanOnPush=true --tags Key=Project,Value=vandelay-demo >/dev/null
aws ecr get-login-password | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$REGION.amazonaws.com" >/dev/null
docker buildx build --platform linux/amd64 -t "$ECR:$IMAGE_TAG" --push "$ROOT/mcp"

# ---- App Runner ------------------------------------------------------------------------------------
service_json() { # env -> json on stdout
  local env="$1" appenv secrets="" name var api_var="API_URL_$1"
  if [ "$env" = prod ]; then appenv=production; else appenv=test; fi
  for name in API_TOKEN_AGENT API_TOKEN_ADJUSTER API_TOKEN_SUPERVISOR API_TOKEN_CUSTOMER; do
    var="$(secret_arn "$P/$env/$name")"
    [ -n "$var" ] && [ "$var" != None ] || { echo "Missing secret $P/$env/$name; run deploy.sh first." >&2; exit 1; }
    secrets="${secrets:+$secrets,}\"$name\":\"$var\""
  done
  cat <<JSON
{
  "ServiceName": "$P-mcp-$env",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR:$IMAGE_TAG",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "PORT": "8080", "APP_ENV": "$appenv", "VANDELAY_API_URL": "${!api_var}", "ADJUSTER_APPROVAL_LIMIT": "$ADJUSTER_APPROVAL_LIMIT"
        },
        "RuntimeEnvironmentSecrets": { $secrets }
      }
    },
    "AuthenticationConfiguration": { "AccessRoleArn": "$ACCESS_ROLE" },
    "AutoDeploymentsEnabled": false
  },
  "InstanceConfiguration": { "Cpu": "$CPU", "Memory": "$MEMORY", "InstanceRoleArn": "$INSTANCE_ROLE" },
  "HealthCheckConfiguration": { "Protocol": "HTTP", "Path": "/health", "Interval": 10, "Timeout": 5, "HealthyThreshold": 1, "UnhealthyThreshold": 10 },
  "NetworkConfiguration": { "IngressConfiguration": { "IsPubliclyAccessible": true } },
  "AutoScalingConfigurationArn": "$AUTOSCALING",
  "Tags": [{ "Key": "Project", "Value": "vandelay-demo" }]
}
JSON
}

for env in prod test; do
  step "App Runner service $P-mcp-$env"
  arn="$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P-mcp-$env'].ServiceArn | [0]" --output text)"
  f="$(mktemp)"; service_json "$env" > "$f"
  if [ "$arn" = None ]; then
    arn="$(aws apprunner create-service --cli-input-json "file://$f" --query Service.ServiceArn --output text)"
  else
    # Redeploy: new image tag and the current environment (API URL, authority limit); secrets stay as created.
    aws apprunner update-service --service-arn "$arn" --source-configuration "$(python3 -c "import json; print(json.dumps(json.load(open('$f'))['SourceConfiguration']))")" >/dev/null
  fi
  rm -f "$f"
  printf -v "SERVICE_ARN_${env}" '%s' "$arn"
done

wait_running() { # arn
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
for env in prod test; do var="SERVICE_ARN_$env"; step "Waiting for $P-mcp-$env to be RUNNING"; wait_running "${!var}"; done

# ---- WAF (reuse the per-IP rate limit from deploy.sh) ------------------------------------------------
WAF_ARN="$(aws wafv2 list-web-acls --scope REGIONAL --query "WebACLs[?Name=='$P-rate-limit'].ARN | [0]" --output text)"
if [ "$WAF_ARN" != None ]; then
  step "Attaching the $P-rate-limit WAF web ACL"
  for env in prod test; do var="SERVICE_ARN_$env"; aws wafv2 associate-web-acl --web-acl-arn "$WAF_ARN" --resource-arn "${!var}" >/dev/null 2>&1 || echo "Could not attach WAF to $P-mcp-$env" >&2; done
fi

# ---- Result ----------------------------------------------------------------------------------------
step "Done"
for env in prod test; do
  var="SERVICE_ARN_$env"; api_var="API_URL_$env"; url="$(aws apprunner describe-service --service-arn "${!var}" --query Service.ServiceUrl --output text)"
  echo "$env: https://$url/mcp   (APIs: ${!api_var})"
done
