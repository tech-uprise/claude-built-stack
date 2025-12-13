# AWS Teardown Guide

**Complete guide to shut down all AWS resources and avoid charges**

After you're done learning and want to shut down the RadioCalico AWS deployment, follow this guide to delete all resources and verify zero ongoing charges.

**⚠️ WARNING:** This will permanently delete:
- Your deployed application
- The RDS database and all data
- All Docker images in ECR
- You cannot undo this!

**Estimated Time:** 15-20 minutes

---

## Pre-Teardown Checklist

Before deleting everything, you might want to:

- [ ] Export any data from RDS database
- [ ] Take screenshots of your deployment
- [ ] Document any lessons learned
- [ ] Update your README with "Demo was live, now shut down"
- [ ] Download CloudWatch logs if needed

---

## Teardown Order

**Important:** Delete resources in this order to avoid dependencies:

1. App Runner (application)
2. ECR (Docker images)
3. RDS (database) - Takes longest
4. IAM Roles (if custom created)
5. CloudWatch Alarms
6. Verify billing shows $0

---

## Step 1: Delete App Runner Service

### Using AWS Console

1. Go to **App Runner Console:** https://console.aws.amazon.com/apprunner/
2. Select **radiocalco-app** service
3. Click **"Actions"** → **"Delete service"**
4. Type `delete` to confirm
5. Click **"Delete"**

**Status:** Wait until status shows **"Deleted"** (~2-3 minutes)

### Using AWS CLI

```bash
# Get service ARN
SERVICE_ARN=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='radiocalco-app'].ServiceArn" \
    --output text)

# Delete service
aws apprunner delete-service --service-arn $SERVICE_ARN

# Verify deletion
aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='radiocalco-app']"
# Should return empty list
```

**💰 Cost Impact:** No more compute charges (~$5-15/month saved)

---

## Step 2: Delete ECR Repository

### Using AWS Console

1. Go to **ECR Console:** https://console.aws.amazon.com/ecr/
2. Select **radiocalco-app** repository
3. Click **"Delete"**
4. Type `delete` to confirm
5. Click **"Delete"**

**Note:** This deletes all Docker images stored in the repository.

### Using AWS CLI

```bash
# Delete repository and all images
aws ecr delete-repository \
    --repository-name radiocalco-app \
    --force \
    --region us-west-2

# Verify deletion
aws ecr describe-repositories --repository-names radiocalco-app
# Should return RepositoryNotFoundException
```

**💰 Cost Impact:** No more storage charges (~$0.10/month saved)

---

## Step 3: Delete RDS Database

**⚠️ CRITICAL:** This permanently deletes your database and ALL data!

### Option A: Delete Without Final Snapshot (Fastest)

**Use if:** You don't need to preserve any data

#### Using AWS Console

1. Go to **RDS Console:** https://console.aws.amazon.com/rds/
2. Click **"Databases"**
3. Select **radiocalco-db**
4. Click **"Actions"** → **"Delete"**
5. **Uncheck** "Create final snapshot"
6. **Check** "I acknowledge that upon instance deletion, automated backups..."
7. Type `delete me` in the confirmation box
8. Click **"Delete"**

**⏱️ Wait Time:** 5-10 minutes for full deletion

#### Using AWS CLI

```bash
aws rds delete-db-instance \
    --db-instance-identifier radiocalco-db \
    --skip-final-snapshot \
    --region us-west-2

# Monitor deletion status
aws rds describe-db-instances \
    --db-instance-identifier radiocalco-db \
    --query 'DBInstances[0].DBInstanceStatus'
# Should eventually error with DBInstanceNotFound
```

### Option B: Delete With Final Snapshot (Preserve Data)

**Use if:** You might want to restore the data later

#### Using AWS Console

1. Follow steps above but **CHECK** "Create final snapshot"
2. Snapshot identifier: `radiocalco-db-final-snapshot`
3. Click **"Delete"**

**Note:** Snapshots cost $0.095/GB-month. Remember to delete the snapshot later if you don't need it!

#### Using AWS CLI

```bash
aws rds delete-db-instance \
    --db-instance-identifier radiocalco-db \
    --final-db-snapshot-identifier radiocalco-db-final-snapshot \
    --region us-west-2
```

**To delete the snapshot later:**

```bash
aws rds delete-db-snapshot \
    --db-snapshot-identifier radiocalco-db-final-snapshot
```

**💰 Cost Impact:** No more database charges (~$0-15/month saved)

---

## Step 4: Delete Security Group

After RDS is fully deleted:

### Using AWS Console

1. Go to **EC2 Console:** https://console.aws.amazon.com/ec2/
2. Click **"Security Groups"** in left sidebar
3. Find **radiocalco-db-sg**
4. Select it → **"Actions"** → **"Delete security groups"**
5. Click **"Delete"**

### Using AWS CLI

```bash
# Get security group ID
SG_ID=$(aws ec2 describe-security-groups \
    --filters Name=group-name,Values=radiocalco-db-sg \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Delete security group
aws ec2 delete-security-group --group-id $SG_ID
```

---

## Step 5: Delete IAM Roles (Optional)

If you created custom IAM roles for App Runner:

### Using AWS Console

1. Go to **IAM Console:** https://console.aws.amazon.com/iam/
2. Click **"Roles"**
3. Search for `AppRunnerECRAccessRole`
4. Select it → **"Delete"**
5. Type role name to confirm → **"Delete"**

### Using AWS CLI

```bash
# List App Runner roles
aws iam list-roles --query 'Roles[?contains(RoleName, `AppRunner`)].RoleName'

# Delete role (detach policies first)
ROLE_NAME="AppRunnerECRAccessRole"

# Detach managed policies
aws iam list-attached-role-policies --role-name $ROLE_NAME \
    --query 'AttachedPolicies[*].PolicyArn' --output text | \
    xargs -n1 aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn

# Delete role
aws iam delete-role --role-name $ROLE_NAME
```

**Note:** Don't delete your `radiocalco-deployer` IAM user unless you're done with AWS completely.

---

## Step 6: Delete CloudWatch Alarms

### Using AWS Console

1. Go to **CloudWatch Console:** https://console.aws.amazon.com/cloudwatch/
2. Click **"Alarms"** → **"All alarms"**
3. Select **radiocalco-billing-alarm**
4. **"Actions"** → **"Delete"**
5. Confirm deletion

### Using AWS CLI

```bash
aws cloudwatch delete-alarms --alarm-names radiocalco-billing-alarm
```

---

## Step 7: Remove GitHub Secrets (Optional)

If you're done with AWS deployment:

1. Go to GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Delete these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `ECR_REPOSITORY`
   - `DB_HOST`
   - `DB_PASSWORD`

---

## Step 8: Verify Everything is Deleted

### Check AWS Console

Visit each service and verify no resources remain:

- [ ] **App Runner:** No services listed
- [ ] **ECR:** No repositories listed
- [ ] **RDS:** No databases listed
- [ ] **EC2 Security Groups:** radiocalco-db-sg deleted
- [ ] **CloudWatch:** No alarms named radiocalco-*

### Using AWS CLI

```bash
# Check App Runner
aws apprunner list-services --query 'ServiceSummaryList[*].ServiceName'
# Should be empty or no radiocalco-app

# Check ECR
aws ecr describe-repositories --query 'repositories[*].repositoryName'
# Should be empty or no radiocalco-app

# Check RDS
aws rds describe-db-instances --query 'DBInstances[*].DBInstanceIdentifier'
# Should be empty or no radiocalco-db
```

---

## Step 9: Verify Billing

**Wait 24-48 hours** for AWS billing to update, then:

1. Go to **Billing Console:** https://console.aws.amazon.com/billing/
2. Click **"Bills"** in left sidebar
3. Check current month charges
4. Look for:
   - RDS charges should be $0
   - App Runner charges should be $0
   - ECR charges should be $0

**Expected Final Cost:**
- Last partial day of App Runner: ~$0.10-0.50
- Data transfer out: ~$0.01-0.10
- **Total shutdown cost: < $1**

---

## Step 10: Update Your Repository

Let others know the demo is shut down:

1. Update README.md:
   ```markdown
   ## Demo Status

   **Note:** The live AWS demo has been shut down to avoid ongoing costs.
   This was a learning project. Follow DEPLOYMENT.md to deploy your own version.
   ```

2. Commit and push:
   ```bash
   git add README.md
   git commit -m "docs: Update with AWS demo shutdown notice"
   git push origin master
   ```

---

## What You Learned

By going through this teardown, you learned:

- ✅ How to properly delete AWS resources
- ✅ Resource dependencies (order matters!)
- ✅ Cost verification
- ✅ Security best practices (deleting access keys)
- ✅ Complete project lifecycle (deploy → use → teardown)

---

## Keeping IAM User for Future Projects

**If you want to keep your AWS account for future learning:**

**Keep:**
- ✅ IAM user `radiocalco-deployer`
- ✅ Access keys (securely stored)
- ✅ AWS CLI configuration

**This allows you to:**
- Deploy other projects later
- Practice AWS skills
- No ongoing charges (no active resources)

**To fully delete IAM user:**

```bash
# Delete access keys
aws iam list-access-keys --user-name radiocalco-deployer \
    --query 'AccessKeyMetadata[*].AccessKeyId' --output text | \
    xargs -n1 aws iam delete-access-key --user-name radiocalco-deployer --access-key-id

# Detach policies
aws iam list-attached-user-policies --user-name radiocalco-deployer \
    --query 'AttachedPolicies[*].PolicyArn' --output text | \
    xargs -n1 aws iam detach-user-policy --user-name radiocalco-deployer --policy-arn

# Delete user
aws iam delete-user --user-name radiocalco-deployer
```

---

## Estimated Total Project Cost

**If you ran for 1 week:**
- App Runner: ~$1.20 (7 days × $0.17/day)
- RDS Free Tier: $0.00
- ECR: $0.00
- Data transfer: ~$0.10
- **Total: ~$1.30**

**If you ran for 2 weeks:**
- App Runner: ~$2.40
- RDS Free Tier: $0.00
- **Total: ~$2.50**

**Pretty affordable for a complete cloud deployment learning experience!**

---

## Troubleshooting Teardown

### Issue: Can't Delete RDS - Deletion Protection

**Error:** "Cannot delete protected database instance"

**Solution:**
1. Go to RDS Console → radiocalco-db
2. Click **"Modify"**
3. Scroll to **"Deletion protection"**
4. **Uncheck** it
5. Click **"Continue"** → **"Apply immediately"** → **"Modify DB instance"**
6. Wait 2-3 minutes, then try deletion again

### Issue: Can't Delete Security Group - Dependencies

**Error:** "has dependent objects"

**Solution:**
1. Ensure RDS is fully deleted first (takes 5-10 min)
2. Wait for RDS deletion to complete
3. Then delete security group

### Issue: Charges Continue After Deletion

**Possible Causes:**
- Database snapshot still exists (costs $0.095/GB-month)
- Backups retained (auto-deleted after retention period)
- Network resources not deleted

**Solution:**
1. Check **RDS → Snapshots** - Delete any manual snapshots
2. Check **EC2 → Elastic IPs** - Release any allocated IPs
3. Wait 24-48 hours for AWS billing to reflect deletions

---

## Final Checklist

Before considering teardown complete:

- [ ] App Runner service deleted
- [ ] ECR repository deleted
- [ ] RDS database deleted (no snapshots if you don't need them)
- [ ] Security groups deleted
- [ ] CloudWatch alarms deleted
- [ ] GitHub secrets removed (optional)
- [ ] Billing shows expected charges only
- [ ] README updated to show demo is shutdown
- [ ] You've documented what you learned!

---

## Congratulations!

You've successfully:
- ✅ Deployed a full-stack application to AWS
- ✅ Learned AWS services (RDS, ECR, App Runner)
- ✅ Implemented CI/CD with GitHub Actions
- ✅ Managed costs responsibly
- ✅ Properly cleaned up resources

**This is a complete DevOps skillset!**

---

**Need to redeploy?** Just follow DEPLOYMENT.md again. All the scripts and configs are ready to go!

**Questions?** Open an issue on GitHub.
