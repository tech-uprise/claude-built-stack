# AWS Infrastructure Restoration Guide
**Project:** RadioCalico (RadioHub)
**Last Active:** December 21, 2025
**AWS Account ID:** 552999418845

---

## Infrastructure Overview

This document contains complete instructions to restore the AWS production environment that was torn down on December 21, 2025.

### Previous Configuration

| Resource | Details |
|----------|---------|
| **App Runner Service** | radiocalco-app (us-west-2) |
| **RDS Database** | radiocalco-db (us-west-1) |
| **ECR Repository** | radiocalco-app (us-west-2) |
| **Estimated Monthly Cost** | ~$73/month |

---

## Step 1: Create RDS PostgreSQL Database

### 1.1 Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier radiocalco-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 17.2 \
  --master-username postgres \
  --master-user-password "YOUR_NEW_PASSWORD_HERE" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --backup-retention-period 7 \
  --publicly-accessible \
  --vpc-security-group-ids sg-XXXXXXXX \
  --db-subnet-group-name default \
  --region us-west-1 \
  --tags Key=Project,Value=RadioCalico Key=Environment,Value=Production
```

**Important Notes:**
- Choose a new secure password (previous: `kriva03rdsPwdSeec!`)
- Wait 5-10 minutes for database to become available
- Update security group to allow PostgreSQL (port 5432) from App Runner IP range

### 1.2 Initialize Database Schema

Once RDS is available, get the endpoint:
```bash
aws rds describe-db-instances \
  --db-instance-identifier radiocalco-db \
  --region us-west-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

Connect and create tables:
```bash
psql -h <RDS_ENDPOINT> -U postgres -d postgres
```

```sql
-- Create database
CREATE DATABASE radiocalco_dev;
\c radiocalco_dev

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Song ratings table
CREATE TABLE song_ratings (
  id SERIAL PRIMARY KEY,
  song_title VARCHAR(500) NOT NULL,
  song_artist VARCHAR(500) NOT NULL,
  rating_type VARCHAR(10) NOT NULL CHECK (rating_type IN ('up', 'down')),
  user_ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(song_title, song_artist, user_ip)
);

CREATE INDEX idx_song_ratings_song ON song_ratings(song_title, song_artist);
CREATE INDEX idx_song_ratings_user ON song_ratings(user_ip);

-- Audit log table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_email);

-- Students table
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  grade VARCHAR(50) NOT NULL,
  major VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_grade ON students(grade);
```

---

## Step 2: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name radiocalco-app \
  --region us-west-2 \
  --tags Key=Project,Value=RadioCalico Key=Environment,Value=Production
```

---

## Step 3: Build and Push Docker Image

### 3.1 Login to ECR

```bash
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin 552999418845.dkr.ecr.us-west-2.amazonaws.com
```

### 3.2 Build and Push Image

```bash
# From project root directory
docker build -t radiocalco-app:latest .

docker tag radiocalco-app:latest 552999418845.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app:latest

docker push 552999418845.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app:latest
```

---

## Step 4: Create IAM Role for App Runner

### 4.1 Create IAM Role (if not exists)

```bash
# Check if role exists
aws iam get-role --role-name AppRunnerECRAccessRole 2>/dev/null

# If not exists, create it
aws iam create-role \
  --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach ECR access policy
aws iam attach-role-policy \
  --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

---

## Step 5: Create App Runner Service

### 5.1 Create apprunner-config.json

Save this to a file named `apprunner-config.json`:

```json
{
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "552999418845.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app:latest",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "3000",
          "DB_HOST": "radiocalco-db.crwe2e4w2r6a.us-west-1.rds.amazonaws.com",
          "DB_PORT": "5432",
          "DB_NAME": "radiocalco_dev",
          "DB_USER": "postgres",
          "DB_PASSWORD": "YOUR_RDS_PASSWORD_HERE"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::552999418845:role/AppRunnerECRAccessRole"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1024",
    "Memory": "2048"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 3
  },
  "ServiceName": "radiocalco-app"
}
```

**Important:** Update `DB_PASSWORD` and `DB_HOST` with your actual values.

### 5.2 Create App Runner Service

```bash
aws apprunner create-service \
  --cli-input-json file://apprunner-config.json \
  --region us-west-2
```

### 5.3 Get Service URL

```bash
aws apprunner describe-service \
  --service-arn $(aws apprunner list-services --region us-west-2 --query 'ServiceSummaryList[?ServiceName==`radiocalco-app`].ServiceArn' --output text) \
  --region us-west-2 \
  --query 'Service.ServiceUrl' \
  --output text
```

Wait 5-10 minutes for deployment to complete.

---

## Step 6: Verify Deployment

### 6.1 Test Health Endpoint

```bash
SERVICE_URL=$(aws apprunner describe-service \
  --service-arn $(aws apprunner list-services --region us-west-2 --query 'ServiceSummaryList[?ServiceName==`radiocalco-app`].ServiceArn' --output text) \
  --region us-west-2 \
  --query 'Service.ServiceUrl' \
  --output text)

curl https://$SERVICE_URL/api/health
```

### 6.2 Test Database Connection

```bash
curl https://$SERVICE_URL/api/test-db
```

---

## Step 7: Configure GitHub Actions (Optional)

Update GitHub Secrets with new values:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` = `us-west-2`
- `ECR_REPOSITORY` = `radiocalco-app`

The existing `.github/workflows/deploy.yml` will handle automatic deployments.

---

## Cost Optimization Options

If you want to reduce costs when re-establishing:

### Option 1: Downsize App Runner ($43/month savings)
Change in `apprunner-config.json`:
```json
"InstanceConfiguration": {
  "Cpu": "256",    // 0.25 vCPU
  "Memory": "512"  // 0.5 GB
}
```

### Option 2: Move RDS to us-west-2 (save $2-5/month + reduce latency)
Change `--region us-west-1` to `--region us-west-2` in RDS creation command.

### Option 3: Use RDS Free Tier (if eligible)
If AWS account is <12 months old, db.t3.micro is free for 750 hours/month.

---

## Previous Configuration Summary

### App Runner
- **Service Name:** radiocalco-app
- **Region:** us-west-2
- **CPU:** 1 vCPU (1024)
- **Memory:** 2 GB (2048 MB)
- **Port:** 3000
- **Health Check:** /api/health
- **Cost:** ~$57/month

### RDS PostgreSQL
- **Instance ID:** radiocalco-db
- **Region:** us-west-1 (⚠️ different from App Runner)
- **Class:** db.t3.micro
- **Engine:** PostgreSQL 17.2
- **Storage:** 20 GB gp2
- **Multi-AZ:** No
- **Public Access:** Yes
- **Backup Retention:** 7 days
- **VPC:** vpc-0dbf2bec9d4f724cf
- **Cost:** ~$15/month

### ECR
- **Repository:** radiocalco-app
- **Region:** us-west-2
- **Images:** ~4 images, ~57 MB each
- **Cost:** <$1/month

### Environment Variables (App Runner)
```
NODE_ENV=production
PORT=3000
DB_HOST=radiocalco-db.crwe2e4w2r6a.us-west-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=radiocalco_dev
DB_USER=postgres
DB_PASSWORD=kriva03rdsPwdSeec!
```

---

## Troubleshooting

### Issue: "no encryption" error
**Solution:** SSL is auto-enabled in db.js for RDS endpoints (line 27)

### Issue: App Runner can't pull from ECR
**Solution:** Verify AppRunnerECRAccessRole has AWSAppRunnerServicePolicyForECRAccess policy

### Issue: Database connection timeout
**Solution:** Check RDS security group allows port 5432 from App Runner

### Issue: Health check failing
**Solution:** Verify `/api/health` endpoint returns 200 status

---

## Total Restoration Time
- **Estimated:** 30-45 minutes
- **RDS creation:** 5-10 minutes
- **Database initialization:** 2-3 minutes
- **Docker build/push:** 5-10 minutes
- **App Runner deployment:** 5-10 minutes
- **Testing and verification:** 5-10 minutes

---

## Support Resources
- **GitHub:** https://github.com/[your-repo]/radiocalco
- **AWS Console:** https://console.aws.amazon.com
- **Project Documentation:** CLAUDE.md, DEPLOYMENT.md
