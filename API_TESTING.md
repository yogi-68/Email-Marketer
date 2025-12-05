# API Testing Examples

## Health Checks

### ML Service Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "healthy", "service": "ml-sto"}
```

### NestJS API Health
```bash
curl http://localhost:3001
```

## Email Operations

### 1. Send Bulk Email Campaign

```bash
curl -X POST http://localhost:3001/email/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {
        "email": "user1@example.com",
        "personalizations": {
          "name": "John",
          "company": "Acme Inc"
        }
      },
      {
        "email": "user2@example.com",
        "personalizations": {
          "name": "Jane",
          "company": "Beta Corp"
        }
      }
    ],
    "from": "noreply@yourdomain.com",
    "subject": "Hello {{name}} from {{company}}!",
    "htmlBody": "<h1>Hi {{name}}!</h1><p>Welcome to our platform.</p>",
    "textBody": "Hi {{name}}! Welcome to our platform.",
    "customerId": "customer-123",
    "campaignId": "campaign-456",
    "useSTO": true
  }'
```

Expected response:
```json
{
  "queuedCount": 2,
  "jobIds": ["1", "2"]
}
```

### 2. Get Reputation Metrics

```bash
curl http://localhost:3001/email/reputation
```

Expected response:
```json
{
  "bounceRate": 1.2,
  "complaintRate": 0.05,
  "deliveryAttempts": 10000
}
```

### 3. Check Warmup Status

```bash
curl http://localhost:3001/email/warmup/customer-123
```

Expected response:
```json
{
  "currentDay": 10,
  "totalEmailsSent": 5000,
  "allowedToday": 1600,
  "remainingToday": 1100,
  "isComplete": false
}
```

## ML Service Operations

### 1. Predict Send Time Optimization

```bash
curl -X POST http://localhost:5000/predict-sto \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com"
    ],
    "timezone": "UTC",
    "campaignType": "marketing"
  }'
```

Expected response:
```json
{
  "predictions": [
    {
      "email": "user1@example.com",
      "optimal_hour": 10,
      "confidence": 0.85,
      "delay_ms": 14400000,
      "profile_strength": "high"
    },
    {
      "email": "user2@example.com",
      "optimal_hour": 18,
      "confidence": 0.72,
      "delay_ms": 43200000,
      "profile_strength": "medium"
    }
  ],
  "model_version": "1.0.0",
  "timestamp": "2023-10-27T12:00:00.000Z"
}
```

## Testing Scenarios

### Scenario 1: Small Campaign without STO

```bash
curl -X POST http://localhost:3001/email/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"email": "test1@example.com"},
      {"email": "test2@example.com"}
    ],
    "from": "noreply@yourdomain.com",
    "subject": "Test Email",
    "htmlBody": "<p>This is a test</p>",
    "customerId": "customer-123",
    "campaignId": "test-campaign-1",
    "useSTO": false
  }'
```

### Scenario 2: Campaign with STO Enabled

```bash
curl -X POST http://localhost:3001/email/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"email": "user1@example.com"},
      {"email": "user2@example.com"},
      {"email": "user3@example.com"}
    ],
    "from": "noreply@yourdomain.com",
    "subject": "Optimized Delivery",
    "htmlBody": "<p>This email will be delivered at your optimal time</p>",
    "customerId": "customer-456",
    "campaignId": "sto-campaign-1",
    "useSTO": true
  }'
```

### Scenario 3: Warmup Limit Test

Try to send more than allowed for the current day:

```bash
# First, check current status
curl http://localhost:3001/email/warmup/customer-789

# If day 1 (max 50), try to send 100
curl -X POST http://localhost:3001/email/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [/* 100 recipients */],
    "from": "noreply@yourdomain.com",
    "subject": "Warmup Test",
    "htmlBody": "<p>Testing warmup limits</p>",
    "customerId": "customer-789",
    "campaignId": "warmup-test-1",
    "useSTO": false
  }'
```

Expected: Error response about warmup limits

## AWS SES Configuration

### Verify Domain (CLI)

```bash
aws ses verify-domain-identity --domain yourdomain.com --region us-east-1
```

### Create Configuration Set

```bash
aws ses create-configuration-set \
  --configuration-set Name=email-marketer-events \
  --region us-east-1
```

### Add Event Destination (SNS)

```bash
aws ses put-configuration-set-event-destination \
  --configuration-set-name email-marketer-events \
  --event-destination '{
    "Name": "email-events",
    "Enabled": true,
    "MatchingEventTypes": ["send", "delivery", "open", "click", "bounce", "complaint"],
    "SNSDestination": {
      "TopicARN": "arn:aws:sns:us-east-1:ACCOUNT_ID:email-events"
    }
  }' \
  --region us-east-1
```

## Monitoring & Debugging

### Check BullMQ Queue Status

Using Redis CLI:
```bash
docker exec -it email-marketer-redis-1 redis-cli

# List all keys
KEYS bull:email:*

# Get queue length
LLEN bull:email:wait

# View a job
GET bull:email:1
```

### Check PostgreSQL Database

```bash
docker exec -it email-marketer-postgres-1 psql -U user -d email_marketer

# List tables
\dt

# Query warmup status
SELECT * FROM warmup_status;

# Query recent campaigns
SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 10;
```

### View ML Service Logs

```bash
docker logs email-marketer-ml-service-1 -f
```

### View NestJS Logs

In development:
```bash
cd apps/api
npm run start:dev
# Logs appear in terminal
```

## Performance Testing

### Load Test with Apache Bench

```bash
# Create a test payload file: payload.json
{
  "recipients": [{"email": "load@test.com"}],
  "from": "noreply@yourdomain.com",
  "subject": "Load Test",
  "htmlBody": "<p>Test</p>",
  "customerId": "load-test",
  "campaignId": "load-1",
  "useSTO": false
}

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -T 'application/json' \
  -p payload.json \
  http://localhost:3001/email/send-bulk
```

### Expected Performance Targets

- API endpoint response: <200ms (P95)
- Email processing rate: 100+ emails/second
- STO prediction: <500ms for 100 emails
- Queue throughput: 1000+ jobs/second

## Common Error Responses

### Warmup Limit Exceeded
```json
{
  "statusCode": 400,
  "message": "Warmup limit exceeded. You can send 50 more emails today (Day 3 of warmup)."
}
```

### AWS SES Error
```json
{
  "statusCode": 500,
  "message": "Failed to send email",
  "error": "MessageRejected: Email address is not verified."
}
```

### ML Service Unavailable
```json
{
  "statusCode": 502,
  "message": "ML service error: Connection refused"
}
```

## Useful Commands

### Reset Database
```bash
docker-compose down -v
docker-compose up -d postgres
# Run migrations
```

### Flush Redis Queue
```bash
docker exec -it email-marketer-redis-1 redis-cli FLUSHALL
```

### Rebuild ML Service
```bash
docker-compose build ml-service
docker-compose up -d ml-service
```

### Check Container Status
```bash
docker-compose ps
docker-compose logs
```
