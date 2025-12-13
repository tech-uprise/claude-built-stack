# AWS Cost Guide for RadioCalico

**Comprehensive guide to understanding, tracking, and minimizing AWS costs**

This guide helps you understand exactly what you're paying for and how to keep costs low while learning.

---

## Cost Summary

### Expected Costs (First 12 Months with Free Tier)

| Service | Free Tier | After Free Tier | RadioCalico Usage | Your Cost |
|---------|-----------|-----------------|-------------------|-----------|
| **RDS (PostgreSQL)** | 750 hrs/month db.t3.micro | $15.33/month | 730 hrs/month | **$0.00** |
| **RDS Storage** | 20GB | $0.115/GB-month | 20GB | **$0.00** |
| **ECR Storage** | 500MB | $0.10/GB-month | ~100MB | **$0.00** |
| **App Runner** | None | $0.007/hr compute | 730 hrs/month | **$5.11/month** |
| **App Runner Provisioned** | None | $0.025/instance-hour | 730 hrs/month | **$18.25/month** |
| **Data Transfer Out** | 100GB | $0.09/GB | ~1GB | **$0.00** |
| **CloudWatch Logs** | 5GB | $0.50/GB | <1GB | **$0.00** |
| | | | **TOTAL** | **~$5-10/month** |

### Expected Costs (After First 12 Months)

| Service | Cost | Notes |
|---------|------|-------|
| RDS db.t3.micro | $15.33/month | 730 hours |
| RDS Storage 20GB | $2.30/month | gp2 SSD |
| App Runner | $5.11/month | Minimum 1 instance |
| **TOTAL** | **~$23/month** | For always-on deployment |

---

## Detailed Cost Breakdown

### 1. AWS App Runner

**What you're paying for:** Serverless container hosting

**Pricing Model:**
- **Compute:** $0.007 per vCPU-hour
- **Memory:** $0.0008 per GB-hour
- **Provisioned instances:** $0.025 per instance-hour (always-on)

**RadioCalico Configuration:**
- 1 vCPU, 2GB RAM
- Min: 1 instance, Max: 3 instances
- Always-on (1 instance minimum)

**Cost Calculation:**
```
Compute: 1 vCPU × $0.007/hr × 730 hrs = $5.11/month
Memory: 2 GB × $0.0008/hr × 730 hrs = $1.17/month
Provisioned: 1 instance × $0.025/hr × 730 hrs = $18.25/month

Actual billing uses EITHER compute+memory OR provisioned (whichever is higher)
Result: ~$18-20/month for always-on
```

**💡 Cost Optimization:**
- **Reduce to 0.25 vCPU:** $1.28/month compute (may be slow)
- **Reduce memory to 512MB:** $0.29/month memory
- **Scale to zero:** Not possible with App Runner (always 1 instance minimum)

**Estimate for your learning period (2 weeks):**
```
$18.25/month ÷ 30 days × 14 days = ~$8.52
```

---

### 2. AWS RDS (PostgreSQL)

**What you're paying for:** Managed database hosting

**Pricing Model:**
- **Instance:** $0.021 per db.t3.micro hour
- **Storage:** $0.115 per GB-month (gp2 SSD)
- **Backups:** Free up to 100% of database storage
- **Data transfer:** Free within same region

**Free Tier (First 12 Months):**
- ✅ 750 hours/month of db.t3.micro (enough for 1 always-on instance)
- ✅ 20GB of storage
- ✅ 20GB of backups

**RadioCalico Configuration:**
- db.t3.micro (1 vCPU, 1GB RAM)
- 20GB storage
- 7-day backup retention

**Cost Calculation (After Free Tier):**
```
Instance: 730 hrs × $0.021/hr = $15.33/month
Storage: 20GB × $0.115/GB = $2.30/month
Backups: FREE (within limit)
Total: $17.63/month
```

**During Free Tier:**
```
Cost: $0.00/month (covered by free tier)
```

---

### 3. AWS ECR (Container Registry)

**What you're paying for:** Docker image storage

**Pricing Model:**
- **Storage:** $0.10 per GB-month
- **Data transfer out:** $0.09 per GB

**Free Tier (Always):**
- ✅ 500MB storage free per month

**RadioCalico Usage:**
- Docker image size: ~100MB
- Stored images: 2-3 versions (latest + SHA tags)
- Total: ~300MB

**Cost Calculation:**
```
Storage: 0.3GB × $0.10/GB = $0.03/month (under free tier)
Data transfer: Minimal (only to App Runner in same region = free)
Total: $0.00/month
```

---

### 4. Data Transfer

**What you're paying for:** Network traffic leaving AWS

**Pricing Model:**
- **First 100GB/month:** FREE
- **Next 10TB:** $0.09 per GB
- **Within AWS (same region):** FREE

**RadioCalico Usage:**
- App to RDS: FREE (same region)
- ECR to App Runner: FREE (same region)
- Users accessing app: ~1-2GB/month (under free tier)

**Cost:** $0.00/month (under free tier)

---

### 5. CloudWatch (Monitoring & Logs)

**What you're paying for:** Logs and metrics storage

**Pricing Model:**
- **Logs ingested:** $0.50 per GB
- **Logs stored:** $0.03 per GB
- **Metrics:** First 10 custom metrics FREE

**Free Tier (Always):**
- ✅ 5GB log ingestion
- ✅ 5GB log storage
- ✅ 10 custom metrics

**RadioCalico Usage:**
- Logs: ~500MB/month
- Metrics: ~5 metrics

**Cost:** $0.00/month (under free tier)

---

## Cost Tracking & Monitoring

### Set Up Billing Alerts

#### Method 1: Cost Budget

1. Go to **AWS Budgets:** https://console.aws.amazon.com/billing/home#/budgets
2. Click **"Create budget"**
3. Choose **"Customize"** → **"Monthly cost budget"**
4. **Budget name:** `RadioCalico-Monthly`
5. **Budgeted amount:** `$20.00`
6. **Alert threshold:** `80%` ($16.00)
7. **Email recipients:** your@email.com
8. Click **"Create budget"**

#### Method 2: CloudWatch Billing Alarm

Already covered in DEPLOYMENT.md Step 15.

### View Current Costs

1. Go to **Cost Explorer:** https://console.aws.amazon.com/cost-management/home#/cost-explorer
2. Click **"Launch Cost Explorer"** (first time setup)
3. View:
   - **Daily costs**
   - **Service breakdown**
   - **Forecast**

### Check Free Tier Usage

1. Go to **Billing Dashboard:** https://console.aws.amazon.com/billing/
2. Click **"Free Tier"** in left sidebar
3. See usage for:
   - RDS: X of 750 hours used
   - ECR: X of 500MB used

---

## Daily Cost Estimation

### Typical Daily Costs

| Day | What You're Doing | Expected Cost |
|-----|-------------------|---------------|
| **Day 1** | Setup RDS, ECR | $0.00 (setup only) |
| **Day 2** | Deploy App Runner | $0.61 (partial day) |
| **Day 3-7** | App running | $0.61/day |
| **Day 8** | Testing, monitoring | $0.61/day |
| **Day 9-14** | Still running | $0.61/day |
| **Day 15** | Teardown | $0.10 (partial day) |
| | **Total (2 weeks)** | **~$8-10** |

### Cost per Hour

| Service | Cost per Hour |
|---------|---------------|
| App Runner (1 vCPU, 2GB) | $0.025/hr |
| RDS db.t3.micro (free tier) | $0.00/hr |
| ECR | $0.00/hr (storage) |
| **Total** | **$0.025/hr** |

**Example calculations:**
- Running for 8 hours: $0.20
- Running for 1 day: $0.60
- Running for 1 week: $4.20
- Running for 2 weeks: $8.40
- Running for 1 month: $18.25

---

## Cost Optimization Strategies

### Strategy 1: Stop When Not Using

**App Runner doesn't support pausing**, but you can:

```bash
# Delete service when not using
aws apprunner delete-service --service-arn <your-service-arn>

# Redeploy when needed (takes 5-10 min)
# Follow DEPLOYMENT.md Step 13 again
```

**Savings:** $18/month → $0 during stopped periods

**Trade-off:** 10 minutes to redeploy when you want to use it

### Strategy 2: Reduce App Runner Size

Current: 1 vCPU, 2GB RAM
Minimum: 0.25 vCPU, 512MB RAM

**Savings:** $18/month → ~$2/month

**Trade-off:** Slower performance, may not handle concurrent users well

### Strategy 3: Use AWS Lightsail Instead

For learning projects, Lightsail might be cheaper:
- Fixed price: $7/month (512MB RAM, 20GB SSD)
- Includes compute + database on one instance

**Savings:** ~$11/month

**Trade-off:** Less scalable, manual setup

### Strategy 4: Local Development Only

Keep everything local (Docker Compose):

**Cost:** $0/month

**Trade-off:** No public URL, no cloud experience

---

## Hidden Costs to Watch

### 1. Data Transfer Costs

**Scenario:** If your app becomes popular and serves lots of traffic

**Cost:** After 100GB free tier, $0.09/GB

**Example:** 500GB data transfer = $36/month

**Mitigation:** Use CloudFront CDN for static assets (1TB free tier)

### 2. RDS Snapshot Storage

**If you create manual snapshots:** $0.095/GB-month

**Example:** 20GB snapshot = $1.90/month

**Mitigation:** Delete snapshots you don't need

### 3. Elastic IPs Not Attached

**Cost:** $0.005/hour ($3.60/month) for unattached IPs

**Mitigation:** We don't use Elastic IPs, but check EC2 console to be sure

### 4. NAT Gateway (If You Use One)

**Cost:** $0.045/hour ($32.40/month) + data transfer

**Mitigation:** We don't use NAT Gateway in this setup

---

## Billing FAQ

### Q: When will I be charged?

**A:** AWS bills monthly, usually on the 1st of the month for the previous month's usage.

### Q: How do I get a refund?

**A:** If you're within free tier and got charged incorrectly, contact AWS Support. Usually, they're helpful for genuine mistakes.

### Q: What if I forget to delete resources?

**A:** Your billing alarm will alert you. Worst case: ~$25/month until you notice.

### Q: Can I set a hard spending limit?

**A:** AWS doesn't offer hard caps. Use:
- Billing alarms
- AWS Budgets with alerts
- Cost Explorer for monitoring

### Q: What's the cheapest way to learn AWS?

**A:**
1. Use Free Tier services only (first 12 months)
2. Teardown resources immediately after learning
3. Use AWS Educate (students get credits)
4. This project: ~$10 total for 2 weeks of learning

---

## Cost Comparison

### RadioCalico on Different Platforms

| Platform | Monthly Cost | Pros | Cons |
|----------|-------------|------|------|
| **AWS (this guide)** | $5-25 | Scalable, learning | Complex setup |
| **Heroku** | $7-10 | Easy setup | Less control |
| **DigitalOcean** | $12 | Simple pricing | Manual scaling |
| **Render** | $7 | Free tier, easy | Limited free tier |
| **Railway** | $5-10 | Developer-friendly | Small free tier |
| **Fly.io** | $0-5 | Generous free tier | Newer platform |
| **Local (Docker)** | $0 | No cost | Not public |

---

## Sample Billing Scenario

### 2-Week Learning Project

**Week 1: Setup & Deploy**
```
Day 1: RDS + ECR setup: $0.00
Day 2-7: App Runner running: $3.65 (6 days × $0.61)
```

**Week 2: Testing & Teardown**
```
Day 8-13: App Runner running: $3.65
Day 14: Partial day + teardown: $0.10
```

**Total:** $7.40

**Actual AWS bill might show:**
```
AWS App Runner: $7.25
RDS: $0.00 (free tier)
ECR: $0.00 (free tier)
Data Transfer: $0.05
Tax: $0.50
TOTAL: $7.80
```

---

## Maximizing Free Tier

### First 12 Months Free (Per AWS Account)

| Service | Free Tier | How to Maximize |
|---------|-----------|-----------------|
| **EC2** | 750 hrs/month | Could use instead of App Runner (more complex) |
| **RDS** | 750 hrs/month | ✅ We're using this |
| **S3** | 5GB storage | Could serve static files |
| **Lambda** | 1M requests | Alternative architecture |
| **CloudFront** | 1TB data transfer | Use for CSS/JS/images |

### Always Free (No Expiration)

| Service | Always Free | RadioCalico Usage |
|---------|-------------|-------------------|
| **DynamoDB** | 25GB storage | Not using (PostgreSQL) |
| **Lambda** | 1M requests/month | Not using (container app) |
| **CloudWatch** | 10 metrics, 5GB logs | ✅ Using |
| **SNS** | 1,000 notifications | ✅ For billing alerts |

---

## Final Cost Recommendations

### For This Learning Project:

1. **Budget:** $10-15 for 2 weeks
2. **Set alerts:** At $10 threshold
3. **Check daily:** AWS Cost Explorer
4. **Teardown when done:** Follow TEARDOWN.md
5. **Total learning cost:** < $15

### If You Keep It Running:

1. **Free Tier (first 12 months):** ~$5-10/month
2. **After Free Tier:** ~$23/month
3. **With optimizations:** ~$7/month (Lightsail alternative)

---

## Resources

- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS Free Tier Details](https://aws.amazon.com/free/)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [App Runner Pricing](https://aws.amazon.com/apprunner/pricing/)
- [RDS Pricing](https://aws.amazon.com/rds/postgresql/pricing/)

---

**Bottom Line:** This project costs ~$10-15 for a complete AWS deployment learning experience. That's cheaper than most online courses and you get hands-on experience!

**Questions about costs?** Check AWS Cost Explorer or open an issue on GitHub!
