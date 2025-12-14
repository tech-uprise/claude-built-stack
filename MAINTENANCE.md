# RadioCalico Maintenance Guide

**Last Updated**: December 13, 2025
**Version**: 1.0

This document provides comprehensive maintenance procedures for the RadioCalico application across all environments (local, Docker, AWS).

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monitoring](#monitoring)
3. [Backup and Recovery](#backup-and-recovery)
4. [Deployment Procedures](#deployment-procedures)
5. [Troubleshooting](#troubleshooting)
6. [Database Maintenance](#database-maintenance)
7. [Security Updates](#security-updates)
8. [Cost Optimization](#cost-optimization)

---

## Daily Operations

### Health Checks

**Local/Docker**:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/test-db
```

**AWS Production**:
```bash
curl https://4g3i27nzmy.us-west-2.awsapprunner.com/api/health
curl https://4g3i27nzmy.us-west-2.awsapprunner.com/api/test-db
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-13T..."
}
```

### Log Monitoring

**Docker Logs**:
```bash
# Application logs
docker-compose logs -f app --tail=100

# Database logs
docker-compose logs -f db --tail=100

# All services
docker-compose logs -f --tail=50
```

**AWS App Runner Logs**:
```bash
# Tail live logs
aws logs tail /aws/apprunner/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1/application \
  --region us-west-2 \
  --follow

# View recent logs (last 1 hour)
aws logs tail /aws/apprunner/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1/application \
  --region us-west-2 \
  --since 1h
```

### Service Status

**Docker**:
```bash
docker-compose ps
docker-compose top
```

**AWS App Runner**:
```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-west-2:552999418845:service/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1 \
  --region us-west-2 \
  --query 'Service.[Status,ServiceUrl,CreatedAt]' \
  --output table
```

---

## Monitoring

### Application Metrics

**Key Metrics to Monitor**:
1. **Response Time**: Should be < 500ms for most requests
2. **Error Rate**: Should be < 1%
3. **Request Volume**: Track peak times
4. **Database Connections**: Monitor pool utilization

### AWS CloudWatch

**Set Up Alarms**:
```bash
# Example: High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name radiocalco-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name 4xxErrors \
  --namespace AWS/AppRunner \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --region us-west-2
```

**View Metrics**:
- CloudWatch Console: https://console.aws.amazon.com/cloudwatch/
- Navigate to: App Runner → radiocalco-app → Metrics

**Key Metrics**:
- `2xxStatusCount` - Successful requests
- `4xxStatusCount` - Client errors
- `5xxStatusCount` - Server errors
- `RequestCount` - Total requests
- `ActiveInstances` - Running instances

### Database Monitoring

**RDS CloudWatch Metrics**:
```bash
# CPU Utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=radiocalco-db \
  --start-time 2025-12-13T00:00:00Z \
  --end-time 2025-12-13T23:59:59Z \
  --period 3600 \
  --statistics Average \
  --region us-west-1

# Database Connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=radiocalco-db \
  --start-time 2025-12-13T00:00:00Z \
  --end-time 2025-12-13T23:59:59Z \
  --period 3600 \
  --statistics Maximum \
  --region us-west-1
```

**Alert Thresholds**:
- CPU > 80% for 10 minutes
- Connections > 80 (approaching max)
- Free Storage < 2GB
- Read/Write latency > 100ms

---

## Backup and Recovery

### Database Backups

**AWS RDS Automated Backups**:
- **Frequency**: Daily
- **Retention**: 7 days
- **Backup Window**: Automatic (off-peak hours)
- **Point-in-time recovery**: Enabled

**Verify Backups**:
```bash
aws rds describe-db-snapshots \
  --db-instance-identifier radiocalco-db \
  --region us-west-1 \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

**Manual Backup**:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier radiocalco-db \
  --db-snapshot-identifier radiocalco-manual-$(date +%Y%m%d-%H%M%S) \
  --region us-west-1
```

### Application Backup

**Docker Images**:
- Stored in Amazon ECR
- Tagged with Git commit SHA + `latest`
- Retention: All images retained

**List ECR Images**:
```bash
aws ecr describe-images \
  --repository-name radiocalco-app \
  --region us-west-2 \
  --query 'imageDetails[*].[imageTags[0],imagePushedAt]' \
  --output table
```

### Recovery Procedures

#### Database Point-in-Time Recovery

```bash
# 1. Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier radiocalco-db \
  --target-db-instance-identifier radiocalco-db-restored \
  --restore-time 2025-12-13T12:00:00Z \
  --region us-west-1

# 2. Wait for restore to complete (5-10 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier radiocalco-db-restored \
  --region us-west-1

# 3. Get new endpoint
aws rds describe-db-instances \
  --db-instance-identifier radiocalco-db-restored \
  --region us-west-1 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# 4. Update App Runner environment variable
aws apprunner update-service \
  --service-arn arn:aws:apprunner:us-west-2:552999418845:service/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1 \
  --source-configuration '{"ImageRepository":{"ImageConfiguration":{"RuntimeEnvironmentVariables":{"DB_HOST":"<new-endpoint>"}}}}' \
  --region us-west-2
```

#### Application Rollback

```bash
# 1. List recent images
aws ecr describe-images \
  --repository-name radiocalco-app \
  --region us-west-2 \
  --query 'imageDetails | sort_by(@, &imagePushedAt) | [-5:].[imageTags[0],imagePushedAt]' \
  --output table

# 2. Identify last known good SHA
GOOD_SHA="d292b756627a349b4d665942e23489af9b2542c2"

# 3. Update App Runner to use specific image
aws apprunner update-service \
  --service-arn arn:aws:apprunner:us-west-2:552999418845:service/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1 \
  --source-configuration "{\"ImageRepository\":{\"ImageIdentifier\":\"552999418845.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app:$GOOD_SHA\"}}" \
  --region us-west-2

# 4. Monitor deployment
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-west-2:552999418845:service/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1 \
  --region us-west-2 \
  --query 'Service.Status'
```

---

## Deployment Procedures

### Standard Deployment

**Via GitHub Actions** (Recommended):
```bash
# 1. Commit changes
git add .
git commit -m "Your changes"

# 2. Push to trigger CI/CD
git push origin master

# 3. Monitor workflow
gh run list --workflow=deploy.yml --limit 1

# 4. Watch deployment
gh run watch
```

**Manual Deployment**:
```bash
# 1. Build Docker image
docker build -t radiocalco-app:latest .

# 2. Login to ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin \
  552999418845.dkr.ecr.us-west-2.amazonaws.com

# 3. Tag and push
docker tag radiocalco-app:latest \
  552999418845.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app:latest
docker push 552999418845.dkr.ecr.us-west-2.amazonaws.com/radiocalco-app:latest

# 4. Trigger App Runner deployment
aws apprunner start-deployment \
  --service-arn arn:aws:apprunner:us-west-2:552999418845:service/radiocalco-app/eb16382313be4abebdb4b77b5a8077c1 \
  --region us-west-2
```

### Emergency Deployment

**Hot Fix Process**:
1. Create fix in local branch
2. Test locally: `npm test && npm run dev`
3. Build and push immediately (skip CI if critical)
4. Monitor closely after deployment
5. Create proper PR and merge after incident

---

## Troubleshooting

### Common Issues

#### Issue 1: Database Connection Failed

**Symptoms**:
```json
{
  "status": "error",
  "message": "Database connection failed",
  "error": "no pg_hba.conf entry..."
}
```

**Diagnosis**:
```bash
# Check RDS security group
aws ec2 describe-security-groups \
  --group-ids sg-09965ceaeee2c98d6 \
  --region us-west-1

# Test connection from local machine
psql -h radiocalco-db.crwe2e4w2r6a.us-west-1.rds.amazonaws.com \
  -U postgres \
  -d radiocalco_dev
```

**Solutions**:
1. Verify security group allows port 5432
2. Check SSL configuration in db.js:27
3. Verify RDS instance is running
4. Check App Runner environment variables

#### Issue 2: App Runner Service Unhealthy

**Symptoms**:
- Health checks failing
- Service status: `OPERATION_IN_PROGRESS` or `UPDATE_FAILED`

**Diagnosis**:
```bash
# Check service status
aws apprunner describe-service \
  --service-arn <service-arn> \
  --region us-west-2

# View recent operations
aws apprunner list-operations \
  --service-arn <service-arn> \
  --region us-west-2

# Check logs for errors
aws logs tail /aws/apprunner/radiocalco-app/<service-id>/application \
  --region us-west-2 \
  --since 30m
```

**Solutions**:
1. Verify `/api/health` endpoint returns 200
2. Check database connectivity
3. Review application logs for errors
4. Verify environment variables are correct
5. Try manual deployment with known good image

#### Issue 3: High Database Connections

**Symptoms**:
- "Too many connections" errors
- Slow query performance

**Diagnosis**:
```bash
# Check current connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=radiocalco-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Maximum \
  --region us-west-1
```

**Solutions**:
1. Scale down App Runner instances temporarily
2. Increase RDS instance size if needed
3. Review connection pool settings in db.js
4. Check for connection leaks in code

#### Issue 4: GitHub Actions Deployment Failed

**Symptoms**:
- Workflow fails at deployment step
- "Service not found" or permission errors

**Diagnosis**:
```bash
# Check workflow run
gh run view <run-id> --log-failed

# Verify App Runner service exists
aws apprunner list-services --region us-west-2

# Check IAM permissions
aws iam list-attached-role-policies --role-name AppRunnerECRAccessRole
```

**Solutions**:
1. Ensure `AWS_REGION` secret is set to `us-west-2`
2. Verify App Runner service exists in correct region
3. Check IAM role has `AWSAppRunnerServicePolicyForECRAccess`
4. Manually trigger deployment after fixing issues

---

## Database Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Review slow query logs
- Check database size growth
- Verify backups are completing
- Review connection metrics

**Monthly**:
- Analyze table statistics
- Review and clean up old audit logs (if needed)
- Check for unused indexes
- Review database parameter group settings

### Vacuum and Analyze

**Docker/Local**:
```bash
# Connect to database
psql -h localhost -U postgres -d radiocalco_dev

# Run vacuum analyze
VACUUM ANALYZE;

# Check table statistics
SELECT schemaname, tablename, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables;
```

**AWS RDS**:
- Autovacuum is enabled by default
- Monitor via CloudWatch or pg_stat_user_tables
- Manual vacuum not usually necessary

### Database Size Monitoring

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('radiocalco_dev')) AS db_size;

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index sizes
SELECT
  indexname,
  tablename,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
```

### Cleanup Old Data

**Audit Logs** (if database grows large):
```sql
-- Check audit log size
SELECT COUNT(*) FROM audit_log;
SELECT pg_size_pretty(pg_total_relation_size('audit_log')) AS audit_log_size;

-- Delete audit logs older than 90 days (optional)
DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum after large delete
VACUUM FULL audit_log;
```

**Test Data**:
```sql
-- Clean up test users
DELETE FROM users WHERE email LIKE 'test-%@example.com';

-- Clean up test students
DELETE FROM students WHERE email LIKE 'test-%@example.com';
```

---

## Security Updates

### Dependency Updates

**Check for Updates**:
```bash
# Check for outdated packages
npm outdated

# Security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

**Update Process**:
1. Review `npm outdated` output
2. Update non-breaking changes: `npm update`
3. Test thoroughly: `npm test`
4. Update major versions individually
5. Commit and deploy via CI/CD

### AWS Security

**IAM Review** (Monthly):
```bash
# List IAM users
aws iam list-users

# Review IAM roles
aws iam list-roles --query 'Roles[?contains(RoleName, `radiocalco`)]'

# Check unused access keys
aws iam list-access-keys --user-name radiocalco-deployer
```

**Security Group Audit**:
```bash
# Review RDS security group
aws ec2 describe-security-groups \
  --group-ids sg-09965ceaeee2c98d6 \
  --region us-west-1

# Find overly permissive rules (0.0.0.0/0)
# Consider restricting to App Runner IP ranges if possible
```

### SSL Certificate

**App Runner SSL**:
- Managed automatically by AWS
- No manual renewal required
- HTTPS enforced by default

**RDS SSL**:
- Certificate managed by AWS
- Automatic rotation
- Application uses SSL via db.js:27

---

## Cost Optimization

### Monitor Costs

**AWS Cost Explorer**:
```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

**Set Up Billing Alerts**:
- See COSTS.md for detailed billing setup
- Recommended threshold: $20/month for dev/test

### Optimization Strategies

**1. App Runner Auto-Scaling**:
- Current: Min 1, Max 3
- Reduce max instances if not needed: Min 1, Max 1
- Saves: ~$5-10/month per unused instance

**2. RDS Instance Right-Sizing**:
- Current: db.t3.micro (free tier)
- Monitor CPU and memory utilization
- Scale down if utilization < 20%

**3. ECR Image Cleanup**:
```bash
# List old images
aws ecr describe-images \
  --repository-name radiocalco-app \
  --region us-west-2 \
  --query 'imageDetails | sort_by(@, &imagePushedAt) | [:-10].[imageDigest,imageTags[0]]'

# Delete old images (keep last 10)
# Manual cleanup or lifecycle policy
```

**4. CloudWatch Logs Retention**:
```bash
# Set log retention to 7 days
aws logs put-retention-policy \
  --log-group-name /aws/apprunner/radiocalco-app/<service-id>/application \
  --retention-in-days 7 \
  --region us-west-2
```

---

## Monitoring Checklist

### Daily
- [ ] Check health endpoints (local, AWS)
- [ ] Review error logs
- [ ] Verify GitHub Actions workflows passed

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check RDS performance metrics
- [ ] Review database connection pool usage
- [ ] Check application response times

### Monthly
- [ ] Review AWS costs and billing
- [ ] Update dependencies (`npm outdated`)
- [ ] Run security audit (`npm audit`)
- [ ] Review and clean up old ECR images
- [ ] Check backup retention and test restore
- [ ] Review CloudWatch alarms
- [ ] Update documentation if needed

### Quarterly
- [ ] Comprehensive security review
- [ ] Performance optimization review
- [ ] Cost optimization review
- [ ] Disaster recovery drill
- [ ] Update ARCHITECTURE.md with changes

---

## Emergency Contacts

**AWS Support**:
- Console: https://console.aws.amazon.com/support/
- Account ID: 552999418845
- Plan: Basic (free)

**GitHub**:
- Repository: https://github.com/tech-uprise/claude-built-stack
- Issues: https://github.com/tech-uprise/claude-built-stack/issues

**Database**:
- RDS Instance ID: `radiocalco-db`
- Region: us-west-1
- Endpoint: `radiocalco-db.crwe2e4w2r6a.us-west-1.rds.amazonaws.com`

**Application**:
- Service Name: `radiocalco-app`
- Region: us-west-2
- URL: https://4g3i27nzmy.us-west-2.awsapprunner.com

---

## Additional Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/17/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **Express.js Security**: https://expressjs.com/en/advanced/best-practice-security.html

---

**Document Version**: 1.0
**Last Review**: December 13, 2025
**Next Review**: March 2026
