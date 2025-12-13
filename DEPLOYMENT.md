# AWS Deployment Guide for RadioCalico

**Complete step-by-step guide to deploy RadioCalico to AWS**

This guide will walk you through deploying the RadioCalico application to AWS using:
- **AWS RDS** (PostgreSQL database)
- **AWS ECR** (Docker container registry)
- **AWS App Runner** (Serverless container hosting)
- **GitHub Actions** (CI/CD pipeline)

**Estimated Time:** 1-2 hours
**Estimated Cost:** $10-20 for learning period (using AWS Free Tier)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [AWS CLI Configuration](#aws-cli-configuration)
4. [Create RDS Database](#create-rds-database)
5. [Create ECR Repository](#create-ecr-repository)
6. [Configure GitHub Actions](#configure-github-actions)
7. [Deploy to App Runner](#deploy-to-app-runner)
8. [Verify Deployment](#verify-deployment)
9. [Set Up Monitoring](#set-up-monitoring)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ **AWS Account** (free tier eligible)
- ✅ **AWS CLI installed** (v2.x recommended)
  ```bash
  # Check if installed
  aws --version

  # If not installed (macOS):
  brew install awscli
  ```
- ✅ **Git & GitHub account**
- ✅ **Docker Desktop installed and running**
- ✅ **Node.js v22+ installed**
- ✅ **This repository cloned locally**

---

## AWS Account Setup

### Step 1: Create AWS Account (if you don't have one)

1. Go to: https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process:
   - Enter email and account name
   - Verify email
   - Enter payment information (required, but we'll use free tier)
   - Verify phone number
   - Select "Basic Support - Free"

**Note:** AWS requires a credit card but won't charge you if you stay within free tier limits.

---

### Step 2: Create IAM User for Deployment

**Why?** We don't want to use root account credentials. IAM users follow security best practices.

#### 2.1 Access IAM Console

1. Sign in to AWS Console: https://console.aws.amazon.com/
2. Search for "IAM" in the top search bar
3. Click "IAM" to open Identity and Access Management

#### 2.2 Create User

1. In IAM Dashboard, click **"Users"** in left sidebar
2. Click **"Create user"** button
3. **User name:** `radiocalco-deployer`
4. Click **"Next"**

#### 2.3 Set Permissions

1. Select **"Attach policies directly"**
2. Search and select the following policies:
   - ✅ `AmazonRDSFullAccess` (manage RDS databases)
   - ✅ `AmazonEC2ContainerRegistryFullAccess` (push Docker images)
   - ✅ `AWSAppRunnerFullAccess` (deploy App Runner services)
   - ✅ `IAMFullAccess` (create service roles)
   - ✅ `AmazonVPCFullAccess` (manage networking)

3. Click **"Next"**
4. Review and click **"Create user"**

#### 2.4 Create Access Keys

1. Click on the newly created user **"radiocalco-deployer"**
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Command Line Interface (CLI)"**
6. Check the confirmation box
7. Click **"Next"** → **"Create access key"**

**⚠️ IMPORTANT:** You'll see:
- **Access Key ID:** `AKIAIOSFODNN7EXAMPLE` (example)
- **Secret Access Key:** `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` (example)

**Save these immediately!** You can't view the secret key again.

**Option 1:** Download the CSV file
**Option 2:** Copy to a secure password manager

---

## AWS CLI Configuration

### Step 3: Configure AWS CLI with Your Credentials

Open your terminal and run:

```bash
aws configure
```

**Prompts and What to Enter:**

```
AWS Access Key ID [None]: PASTE_YOUR_ACCESS_KEY_ID
AWS Secret Access Key [None]: PASTE_YOUR_SECRET_ACCESS_KEY
Default region name [None]: us-west-2
Default output format [None]: json
```

**Region Selection:**
- `us-west-2` (Oregon) - Recommended for West Coast
- `us-east-1` (Virginia) - Popular, more services
- Choose based on your location for lower latency

### Step 4: Verify Configuration

```bash
# Test AWS credentials
aws sts get-caller-identity
```

**Expected Output:**
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/radiocalco-deployer"
}
```

If you see your account info, you're good to go! ✅

---

## Create RDS Database

### Step 5: Create PostgreSQL Database (Free Tier)

**What you're creating:** A managed PostgreSQL database that App Runner will connect to.

#### 5.1 Using AWS Console (Recommended for First Time)

1. **Open RDS Console:** https://console.aws.amazon.com/rds/
2. Click **"Create database"**

3. **Engine Options:**
   - Engine type: **PostgreSQL**
   - Version: **PostgreSQL 17.2** (or latest 17.x)

4. **Templates:**
   - Select **"Free tier"** ✅

5. **Settings:**
   - DB instance identifier: `radiocalco-db`
   - Master username: `postgres`
   - Master password: Create a strong password (save it!)
   - Confirm password

6. **Instance Configuration:**
   - DB instance class: **db.t3.micro** (free tier eligible)

7. **Storage:**
   - Storage type: **General Purpose SSD (gp2)**
   - Allocated storage: **20 GiB** (free tier max)
   - ✅ Enable storage autoscaling
   - Maximum storage threshold: **100 GiB**

8. **Connectivity:**
   - Compute resource: **Don't connect to an EC2 compute resource**
   - VPC: **Default VPC**
   - Subnet group: **default**
   - Public access: **Yes** (for easier initial setup)
     - ⚠️ We'll secure this with security groups
   - VPC security group: **Create new**
   - Security group name: `radiocalco-db-sg`

9. **Database authentication:**
   - Password authentication

10. **Additional Configuration:**
    - Initial database name: `radiocalco_dev`
    - ✅ Enable automated backups
    - Backup retention period: **7 days** (free tier)
    - ✅ Enable encryption (default AWS key)

11. **Estimated monthly costs:** Should show **$0.00** (free tier)

12. Click **"Create database"**

**⏱️ Wait Time:** 5-10 minutes for database to become available

#### 5.2 Using AWS CLI (Alternative)

```bash
# Set variables
DB_PASSWORD="YourSecurePassword123!"  # Change this!
REGION="us-west-2"

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier radiocalco-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 17.2 \
    --master-username postgres \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --max-allocated-storage 100 \
    --vpc-security-group-ids $(aws ec2 create-security-group \
        --group-name radiocalco-db-sg \
        --description "Security group for RadioCalico RDS" \
        --output text --query 'GroupId') \
    --publicly-accessible \
    --backup-retention-period 7 \
    --db-name radiocalco_dev \
    --storage-encrypted \
    --region $REGION
```

### Step 6: Get Database Endpoint

After RDS instance is created (status: **Available**):

1. Go to RDS Console → **Databases**
2. Click on **radiocalco-db**
3. Find **"Endpoint & port"** section
4. Copy the **Endpoint** (looks like: `radiocalco-db.xxxx.us-west-2.rds.amazonaws.com`)

**Save this!** You'll need it for App Runner configuration.

```bash
# Or get endpoint via CLI
aws rds describe-db-instances \
    --db-instance-identifier radiocalco-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
```

### Step 7: Configure Security Group

Allow App Runner to connect to RDS:

1. Go to **RDS → Databases → radiocalco-db**
2. Click on the **VPC security group** link
3. Select the security group → **"Edit inbound rules"**
4. Click **"Add rule"**
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: **Anywhere-IPv4** (`0.0.0.0/0`)
   - Description: `Allow PostgreSQL from App Runner`
5. Click **"Save rules"**

⚠️ **Note:** For production, you'd restrict this to App Runner's IP range. For learning, this is fine.

### Step 8: Initialize Database Schema

From your local machine, connect and create tables:

```bash
# Install psql if you don't have it
brew install libpq

# Connect to RDS (replace with your endpoint and password)
psql -h radiocalco-db.xxxx.us-west-2.rds.amazonaws.com \
     -U postgres \
     -d radiocalco_dev
```

**When prompted, enter your RDS master password.**

Then run the schema creation:

```sql
-- Copy the entire contents of init.sql and paste here
-- Or if you have init.sql locally:
\i /path/to/radiocalco/init.sql

-- Verify tables were created
\dt

-- You should see: users, students, song_ratings, audit_log
```

**Exit psql:**
```sql
\q
```

✅ **Database is ready!**

---

## Create ECR Repository

### Step 9: Create Container Registry

**What you're creating:** A private Docker registry to store your application images.

#### 9.1 Using AWS Console

1. **Open ECR Console:** https://console.aws.amazon.com/ecr/
2. Click **"Create repository"**
3. **Repository name:** `radiocalco-app`
4. **Visibility settings:** Private
5. **Image scan settings:** ✅ Enable scan on push (security)
6. **Encryption settings:** AES-256 (default)
7. Click **"Create repository"**

#### 9.2 Using AWS CLI

```bash
aws ecr create-repository \
    --repository-name radiocalco-app \
    --image-scanning-configuration scanOnPush=true \
    --region us-west-2
```

### Step 10: Get ECR Repository URI

1. In ECR Console, click on **radiocalco-app**
2. Copy the **URI** (looks like: `123456789012.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app`)

**Save this!** You'll need it for GitHub Actions.

```bash
# Or get via CLI
aws ecr describe-repositories \
    --repository-names radiocalco-app \
    --query 'repositories[0].repositoryUri' \
    --output text
```

---

## Configure GitHub Actions

### Step 11: Add AWS Credentials to GitHub Secrets

1. Go to your GitHub repository
2. Click **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**

Add these secrets one by one:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your Access Key ID | From Step 2.4 |
| `AWS_SECRET_ACCESS_KEY` | Your Secret Access Key | From Step 2.4 |
| `AWS_REGION` | `us-west-2` | Your chosen region |
| `ECR_REPOSITORY` | `radiocalco-app` | ECR repo name |
| `DB_HOST` | `radiocalco-db.xxxx.rds.amazonaws.com` | RDS endpoint from Step 6 |
| `DB_PASSWORD` | Your RDS password | From Step 5 |

### Step 12: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: radiocalco_dev
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: radiocalco_dev
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to App Runner
        run: |
          echo "App Runner deployment will be configured in next step"
          echo "Image: ${{ steps.login-ecr.outputs.registry }}/${{ secrets.ECR_REPOSITORY }}:latest"
```

**Commit and push this file:**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push origin master
```

---

## Deploy to App Runner

### Step 13: Create App Runner Service

#### 13.1 Using AWS Console

1. **Open App Runner Console:** https://console.aws.amazon.com/apprunner/
2. Click **"Create service"**

3. **Source:**
   - Repository type: **Container registry**
   - Provider: **Amazon ECR**
   - Container image URI: Browse and select `radiocalco-app:latest`
   - Deployment trigger: **Manual** (we'll use GitHub Actions)
   - ECR access role: **Create new service role**
   - Role name: `AppRunnerECRAccessRole`

4. Click **"Next"**

5. **Service settings:**
   - Service name: `radiocalco-app`
   - Virtual CPU: **1 vCPU**
   - Memory: **2 GB**
   - Port: `3000`

6. **Environment variables** - Add these:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=radiocalco-db.xxxx.rds.amazonaws.com  (your RDS endpoint)
   DB_PORT=5432
   DB_NAME=radiocalco_dev
   DB_USER=postgres
   DB_PASSWORD=YourRDSPassword  (from Step 5)
   ```

7. **Auto scaling:**
   - Min size: **1**
   - Max size: **3**
   - Max concurrency: **100**

8. **Health check:**
   - Protocol: **HTTP**
   - Path: `/api/health`
   - Interval: **10 seconds**
   - Timeout: **5 seconds**
   - Healthy threshold: **1**
   - Unhealthy threshold: **3**

9. Click **"Next"** → **"Create & deploy"**

**⏱️ Wait Time:** 5-10 minutes for first deployment

#### 13.2 Get App Runner URL

After deployment completes (status: **Running**):

1. You'll see **"Default domain"** (like: `https://abc123.us-west-2.awsapprunner.com`)
2. Copy this URL
3. Open it in your browser

✅ **Your app is live!**

---

## Verify Deployment

### Step 14: Test Your Live Application

```bash
# Replace with your App Runner URL
APP_URL="https://your-app.us-west-2.awsapprunner.com"

# Test health endpoint
curl $APP_URL/api/health

# Expected: {"status":"ok","timestamp":"2025-12-13..."}

# Test database connection
curl $APP_URL/api/test-db

# Expected: {"status":"success","message":"Database connection successful"...}
```

**Test in Browser:**
- Main page: `https://your-app.us-west-2.awsapprunner.com`
- Radio player: `https://your-app.us-west-2.awsapprunner.com/radio.html`
- Users page: `https://your-app.us-west-2.awsapprunner.com/users.html`

---

## Set Up Monitoring

### Step 15: Create Billing Alarm

1. Go to **CloudWatch Console:** https://console.aws.amazon.com/cloudwatch/
2. Click **"Alarms"** → **"Create alarm"**
3. Click **"Select metric"**
4. Choose **"Billing"** → **"Total Estimated Charge"**
5. Select **USD** → **"Select metric"**
6. **Conditions:**
   - Threshold type: **Static**
   - Whenever EstimatedCharges is: **Greater than** `20`
7. Click **"Next"**
8. **Configure actions:**
   - Create new SNS topic
   - Topic name: `billing-alerts`
   - Email: your@email.com
9. Click **"Create topic"** → **"Next"**
10. Alarm name: `radiocalco-billing-alarm`
11. Click **"Next"** → **"Create alarm"**

**Check your email and confirm the SNS subscription!**

---

## Troubleshooting

### Common Issues

#### Issue 1: Tests Failing in GitHub Actions
**Error:** `Database connection failed`

**Solution:** Check GitHub Secrets are correctly set. The test job uses its own PostgreSQL service.

#### Issue 2: App Runner Can't Connect to RDS
**Error:** `Connection timeout` or `Connection refused`

**Solutions:**
1. Check RDS security group allows inbound on port 5432
2. Verify RDS is publicly accessible
3. Check DB_HOST in App Runner env vars matches RDS endpoint

#### Issue 3: Docker Build Fails
**Error:** `npm ci failed`

**Solution:** Ensure package.json and package-lock.json are committed to git.

#### Issue 4: App Runner Shows Unhealthy
**Error:** Health check failing

**Solutions:**
1. Check `/api/health` endpoint is accessible
2. Verify PORT=3000 is set in App Runner
3. Check App Runner logs (Console → App Runner → Service → Logs)

---

## Next Steps

✅ **Congratulations! Your app is deployed!**

**What you've learned:**
- AWS RDS setup and management
- Docker container registry (ECR)
- CI/CD with GitHub Actions
- Serverless container deployment (App Runner)
- AWS security and IAM
- Cost monitoring

**Now you can:**
1. Make changes locally
2. Push to GitHub
3. GitHub Actions automatically:
   - Runs tests
   - Builds Docker image
   - Pushes to ECR
4. Manually trigger App Runner deployment (or automate it)

**See TEARDOWN.md for how to shut everything down and avoid charges.**

---

## Cost Breakdown

**Free Tier (First 12 Months):**
- RDS db.t3.micro: 750 hours/month FREE
- ECR: 500MB storage FREE
- App Runner: No free tier, ~$0.007/hour = ~$5/month minimum

**Expected Monthly Cost:**
- First 12 months: $5-15/month
- After free tier: $20-30/month

**See COSTS.md for detailed cost tracking.**

---

## Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Questions or issues?** Open an issue on GitHub!

**🎉 Happy deploying!**
