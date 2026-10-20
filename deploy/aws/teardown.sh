#!/usr/bin/env bash
# Deletes everything deploy.sh created (services, database and its data, secrets, roles, image repo).
#   AWS_PROFILE=<profile> ./deploy/aws/teardown.sh --yes
set -uo pipefail
[ "${1:-}" = "--yes" ] || { echo "This permanently deletes the Vandelay AWS deployment, including the database. Re-run with --yes." >&2; exit 1; }
export AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}"
P=vandelay
step() { printf '\n==> %s\n' "$*"; }

step "App Runner services"
for env in prod test; do
  arn="$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$P-$env'].ServiceArn | [0]" --output text)"
  [ "$arn" != None ] && aws apprunner delete-service --service-arn "$arn" >/dev/null && echo "deleting $P-$env"
done
for _ in $(seq 1 60); do
  left="$(aws apprunner list-services --query "length(ServiceSummaryList[?starts_with(ServiceName,'$P-')])" --output text)"
  [ "$left" = 0 ] && break; sleep 10
done

step "WAF, VPC connector, autoscaling"
waf="$(aws wafv2 list-web-acls --scope REGIONAL --query "WebACLs[?Name=='$P-rate-limit'].[Id,LockToken] | [0]" --output text)"
if [ "$waf" != None ]; then aws wafv2 delete-web-acl --name $P-rate-limit --scope REGIONAL --id "$(echo "$waf" | cut -f1)" --lock-token "$(echo "$waf" | cut -f2)" >/dev/null; fi
vc="$(aws apprunner list-vpc-connectors --query "VpcConnectors[?VpcConnectorName=='$P'].VpcConnectorArn | [0]" --output text)"
[ "$vc" != None ] && aws apprunner delete-vpc-connector --vpc-connector-arn "$vc" >/dev/null
asc="$(aws apprunner list-auto-scaling-configurations --auto-scaling-configuration-name $P --query 'AutoScalingConfigurationSummaryList[0].AutoScalingConfigurationArn' --output text)"
[ "$asc" != None ] && aws apprunner delete-auto-scaling-configuration --auto-scaling-configuration-arn "$asc" >/dev/null

step "RDS"
if aws rds describe-db-instances --db-instance-identifier $P-db >/dev/null 2>&1; then
  aws rds modify-db-instance --db-instance-identifier $P-db --no-deletion-protection --apply-immediately >/dev/null 2>&1
  aws rds delete-db-instance --db-instance-identifier $P-db --skip-final-snapshot --delete-automated-backups >/dev/null
  aws rds wait db-instance-deleted --db-instance-identifier $P-db
fi
aws rds delete-db-subnet-group --db-subnet-group-name $P-db >/dev/null 2>&1

step "Security groups (may need a minute for network interfaces to release)"
VPC="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
for name in $P-db $P-apprunner; do
  for _ in $(seq 1 12); do
    id="$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$VPC" Name=group-name,Values="$name" --query 'SecurityGroups[0].GroupId' --output text)"
    [ "$id" = None ] && break
    aws ec2 delete-security-group --group-id "$id" >/dev/null 2>&1 && break; sleep 10
  done
done

step "Secrets, IAM, ECR"
for s in $(aws secretsmanager list-secrets --filters Key=name,Values=$P/ --query 'SecretList[].Name' --output text); do
  aws secretsmanager delete-secret --secret-id "$s" --force-delete-without-recovery >/dev/null
done
aws iam detach-role-policy --role-name $P-apprunner-ecr --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess 2>/dev/null
aws iam delete-role --role-name $P-apprunner-ecr 2>/dev/null
aws iam delete-role-policy --role-name $P-apprunner-instance --policy-name read-vandelay-secrets 2>/dev/null
aws iam delete-role --role-name $P-apprunner-instance 2>/dev/null
aws ecr delete-repository --repository-name $P-apis --force >/dev/null 2>&1
echo "Done."
