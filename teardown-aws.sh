#!/bin/bash
# AWS Infrastructure Teardown Script
# RadioCalico Project - Complete Removal
# Created: December 21, 2025
#
# WARNING: This will permanently delete all AWS resources with NO backups!
# Estimated time: 10-15 minutes

set -e  # Exit on any error

echo "=========================================="
echo "RadioCalico AWS Infrastructure Teardown"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will PERMANENTLY DELETE:"
echo "   - App Runner service (radiocalco-app)"
echo "   - RDS database (radiocalco-db) - ALL DATA WILL BE LOST"
echo "   - ECR repository and all Docker images"
echo ""
read -p "Type 'DELETE' to confirm teardown: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo "Teardown cancelled."
    exit 0
fi

echo ""
echo "Starting teardown process..."
echo ""

# Step 1: Delete App Runner Service
echo "[1/4] Deleting App Runner service..."
SERVICE_ARN=$(aws apprunner list-services --region us-west-2 --query 'ServiceSummaryList[?ServiceName==`radiocalco-app`].ServiceArn' --output text 2>/dev/null || echo "")

if [ -n "$SERVICE_ARN" ]; then
    aws apprunner delete-service --service-arn "$SERVICE_ARN" --region us-west-2
    echo "✓ App Runner service deletion initiated"
    echo "  Waiting for service to delete (this may take 2-3 minutes)..."

    # Wait for service to be deleted
    while true; do
        STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --region us-west-2 --query 'Service.Status' --output text 2>/dev/null || echo "DELETED")
        if [ "$STATUS" == "DELETED" ] || [ -z "$STATUS" ]; then
            echo "✓ App Runner service deleted successfully"
            break
        fi
        echo "  Status: $STATUS (waiting...)"
        sleep 15
    done
else
    echo "✓ App Runner service not found (already deleted or doesn't exist)"
fi

echo ""

# Step 2: Delete RDS Database Instance
echo "[2/4] Deleting RDS database instance..."
RDS_EXISTS=$(aws rds describe-db-instances --db-instance-identifier radiocalco-db --region us-west-1 --query 'DBInstances[0].DBInstanceIdentifier' --output text 2>/dev/null || echo "")

if [ -n "$RDS_EXISTS" ]; then
    aws rds delete-db-instance \
        --db-instance-identifier radiocalco-db \
        --skip-final-snapshot \
        --delete-automated-backups \
        --region us-west-1
    echo "✓ RDS database deletion initiated (no snapshot)"
    echo "  This will take 5-10 minutes. You can monitor progress with:"
    echo "  aws rds describe-db-instances --db-instance-identifier radiocalco-db --region us-west-1"
else
    echo "✓ RDS database not found (already deleted or doesn't exist)"
fi

echo ""

# Step 3: Delete ECR Repository and all images
echo "[3/4] Deleting ECR repository and all Docker images..."
REPO_EXISTS=$(aws ecr describe-repositories --repository-names radiocalco-app --region us-west-2 --query 'repositories[0].repositoryName' --output text 2>/dev/null || echo "")

if [ -n "$REPO_EXISTS" ]; then
    aws ecr delete-repository \
        --repository-name radiocalco-app \
        --force \
        --region us-west-2
    echo "✓ ECR repository and all images deleted"
else
    echo "✓ ECR repository not found (already deleted or doesn't exist)"
fi

echo ""

# Step 4: Summary
echo "[4/4] Teardown Summary"
echo "=========================================="
echo "✓ App Runner service: Deleted"
echo "✓ RDS database: Deletion in progress (5-10 min)"
echo "✓ ECR repository: Deleted"
echo ""
echo "Resources NOT deleted (require manual action if needed):"
echo "  - IAM Role: AppRunnerECRAccessRole"
echo "  - VPC and Security Groups"
echo "  - CloudWatch Log Groups"
echo ""
echo "To delete IAM role manually (if no longer needed):"
echo "  aws iam detach-role-policy --role-name AppRunnerECRAccessRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
echo "  aws iam delete-role --role-name AppRunnerECRAccessRole"
echo ""
echo "To verify RDS deletion status:"
echo "  aws rds describe-db-instances --db-instance-identifier radiocalco-db --region us-west-1"
echo ""
echo "=========================================="
echo "Teardown complete!"
echo "Restoration guide: AWS_RESTORATION_GUIDE.md"
echo "=========================================="
