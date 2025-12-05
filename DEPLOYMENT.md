# Deployment Guide

## AWS SES Setup (Critical First Step)

### 1. Get Out of SES Sandbox

By default, AWS SES is in "sandbox mode" with severe limitations:
- Can only send to verified email addresses
- Limited to 200 emails/day
- 1 email/second sending rate

**Request Production Access:**
```
AWS Console → SES → Account Dashboard → "Request production access"
```

**In the request form:**
- Use case: Transactional and marketing emails
- Website URL: Your platform URL
- Describe: "Email marketing SaaS platform for our customers"
- Expected volume: Start with realistic numbers (e.g., 50K/day)
- Compliance: Describe your bounce/complaint handling

Approval typically takes 24-48 hours.

### 2. Verify Your Sending Domain

```bash
aws ses verify-domain-identity \
  --domain yourdomain.com \
  --region us-east-1
```

**Add DNS Records:**
AWS will provide verification TXT record:
```
Type: TXT
Name: _amazonses.yourdomain.com
Value: [verification string]
```

### 3. Configure DKIM

```bash
aws ses verify-domain-dkim \
  --domain yourdomain.com \
  --region us-east-1
```

Add 3 CNAME records to DNS:
```
[token1]._domainkey.yourdomain.com → [token1].dkim.amazonses.com
[token2]._domainkey.yourdomain.com → [token2].dkim.amazonses.com
[token3]._domainkey.yourdomain.com → [token3].dkim.amazonses.com
```

### 4. Add SPF Record

```
Type: TXT
Name: yourdomain.com
Value: v=spf1 include:amazonses.com ~all
```

### 5. Add DMARC Record

```
Type: TXT
Name: _dmarc.yourdomain.com
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 6. Create Configuration Set

```bash
aws ses create-configuration-set \
  --configuration-set Name=email-marketer-events \
  --region us-east-1
```

### 7. Create SNS Topic for Events

```bash
aws sns create-topic \
  --name email-events \
  --region us-east-1
```

Note the Topic ARN.

### 8. Add Event Destination

```bash
aws ses put-configuration-set-event-destination \
  --configuration-set-name email-marketer-events \
  --event-destination '{
    "Name": "email-events",
    "Enabled": true,
    "MatchingEventTypes": ["send", "delivery", "open", "click", "bounce", "complaint"],
    "SNSDestination": {
      "TopicARN": "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:email-events"
    }
  }' \
  --region us-east-1
```

## Infrastructure Deployment

### Option 1: AWS Elastic Beanstalk (Simplest)

**Deploy NestJS Backend:**
```bash
cd apps/api
npm run build
eb init -p node.js email-marketer-api --region us-east-1
eb create email-marketer-api-prod

# Configure environment
eb setenv \
  AWS_REGION=us-east-1 \
  AWS_ACCESS_KEY_ID=xxx \
  AWS_SECRET_ACCESS_KEY=xxx \
  DATABASE_URL=postgresql://... \
  REDIS_HOST=xxx \
  ML_SERVICE_URL=http://ml-service-url
```

**Deploy ML Service (Docker on EC2):**
```bash
# Launch EC2 instance with Docker
# SSH into instance
git clone [repo]
cd apps/ml
docker build -t ml-service .
docker run -d -p 5000:5000 ml-service
```

**Deploy Next.js Frontend (Vercel - Recommended):**
```bash
cd apps/web
npm install -g vercel
vercel
```

Or self-host:
```bash
npm run build
npm start
```

### Option 2: Docker Compose (VPS/EC2)

1. Set up a VPS (AWS EC2, DigitalOcean, etc.)
2. Install Docker and Docker Compose
3. Clone repository
4. Create production `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: email_marketer
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/email_marketer
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - ML_SERVICE_URL=http://ml-service:5000
    depends_on:
      - postgres
      - redis
    restart: always

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    restart: always

  ml-service:
    build:
      context: ./apps/ml
    ports:
      - "5000:5000"
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
      - api
    restart: always

volumes:
  postgres_data:
  redis_data:
```

**Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Kubernetes (Scale-ready)

For high-scale deployments, use Kubernetes with:
- Separate deployments for frontend, backend, ML service
- Horizontal Pod Autoscaling for workers
- Managed PostgreSQL (RDS) and Redis (ElastiCache)
- Load balancer with SSL termination

## Database Setup

### Create Production Database

**AWS RDS:**
```bash
aws rds create-db-instance \
  --db-instance-identifier email-marketer-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password [secure-password] \
  --allocated-storage 100 \
  --backup-retention-period 7 \
  --region us-east-1
```

### Run Migrations

```bash
cd apps/api
npm run migration:run
```

## Monitoring & Alerts

### CloudWatch Alarms

**High Bounce Rate Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name email-marketer-high-bounce-rate \
  --alarm-description "Alert when bounce rate exceeds 5%" \
  --metric-name Reputation.BounceRate \
  --namespace AWS/SES \
  --statistic Average \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions [SNS-TOPIC-ARN]
```

**High Complaint Rate Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name email-marketer-high-complaint-rate \
  --alarm-description "Alert when complaint rate exceeds 0.5%" \
  --metric-name Reputation.ComplaintRate \
  --namespace AWS/SES \
  --statistic Average \
  --period 300 \
  --threshold 0.5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions [SNS-TOPIC-ARN]
```

### Application Monitoring

Integrate with monitoring service:
```bash
# Datadog
npm install dd-trace --save

# New Relic
npm install newrelic --save

# Sentry (error tracking)
npm install @sentry/node --save
```

## SSL/TLS Setup

### Using Let's Encrypt (Free)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

Auto-renewal:
```bash
sudo certbot renew --dry-run
```

## Environment Variables (Production)

**Backend (.env)**
```env
NODE_ENV=production
PORT=3001

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[use IAM role instead]
AWS_SECRET_ACCESS_KEY=[use IAM role instead]

# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/email_marketer
DATABASE_SSL=true

# Redis
REDIS_HOST=elasticache-endpoint
REDIS_PORT=6379
REDIS_TLS=true

# ML Service
ML_SERVICE_URL=http://internal-ml-service:5000

# SES
SES_CONFIGURATION_SET=email-marketer-events

# Security
JWT_SECRET=[generate-strong-secret]
ENCRYPTION_KEY=[generate-32-byte-key]

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
```

## Security Checklist

- [ ] Environment variables secured (use AWS Secrets Manager)
- [ ] IAM roles configured (no hardcoded credentials)
- [ ] Database connections use SSL
- [ ] Redis connections use TLS
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Helmet.js security headers enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use ORM)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Regular dependency updates (`npm audit`)
- [ ] DDoS protection (CloudFlare/AWS Shield)

## Backup Strategy

### Database Backups

```bash
# Manual backup
pg_dump -h rds-endpoint -U user email_marketer > backup.sql

# Automated (RDS)
aws rds modify-db-instance \
  --db-instance-identifier email-marketer-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Redis Backups

Configure Redis persistence:
```conf
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000
```

## Scaling Considerations

### Horizontal Scaling

**Backend Workers:**
```bash
# Run multiple worker processes
PM2_INSTANCES=4 pm2 start dist/main.js
```

**ML Service:**
```bash
# Load balancer with multiple instances
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Vertical Scaling

- Start: t3.medium (2 vCPU, 4GB RAM)
- Medium: t3.large (2 vCPU, 8GB RAM)
- High: c5.2xlarge (8 vCPU, 16GB RAM)

### Database Scaling

- Use read replicas for analytics queries
- Connection pooling (pgBouncer)
- Partition large tables (engagement_events)

## Cost Optimization

### AWS Cost Breakdown (Example: 1M emails/month)

- SES: ~$115 (including ancillary)
- EC2 (t3.medium × 3): ~$75/month
- RDS (db.t3.medium): ~$60/month
- ElastiCache (cache.t3.micro): ~$15/month
- Data transfer: ~$20/month
- **Total: ~$285/month**

**Revenue example:**
- 10 customers @ $149/mo = $1,490/mo
- **Margin: ~80%**

### Optimization Tips

1. Use reserved instances (40% savings)
2. Enable S3 lifecycle policies
3. Compress images before storing
4. Use CloudFront CDN
5. Implement email list hygiene (remove bounces)

## Launch Checklist

Before going live:

- [ ] AWS SES out of sandbox
- [ ] Domain verified and warmed up
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring and alerts active
- [ ] Error tracking (Sentry) configured
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Terms of Service live
- [ ] Privacy Policy live
- [ ] GDPR compliance verified
- [ ] Payment processing tested (Stripe)
- [ ] Customer support system ready
- [ ] Documentation published
- [ ] Staging environment tested
- [ ] Rollback plan documented

## Rollback Strategy

If deployment fails:
```bash
# Docker Compose
docker-compose down
git checkout [previous-tag]
docker-compose up -d

# Elastic Beanstalk
eb deploy [previous-version]

# Database
psql < backup.sql
```

## Post-Launch Monitoring

First 24 hours:
- Monitor error rates every hour
- Check email delivery rates
- Verify queue processing
- Watch database performance
- Review user feedback

First week:
- Analyze performance metrics
- Optimize slow queries
- Adjust worker counts
- Review bounce/complaint rates
- Customer interviews

---

**Remember:** Start small, monitor closely, scale gradually.
