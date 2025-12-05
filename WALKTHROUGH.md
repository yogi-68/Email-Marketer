# Implementation Walkthrough

## Phase 1: Foundation (Complete ✅)

### Monorepo Structure
We've established a comprehensive monorepo using npm workspaces:

```
email-marketer/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── ml/           # Python ML service
├── packages/
│   └── shared/       # Shared TypeScript types
└── package.json      # Root workspace config
```

**Why Monorepo?**
- Shared code (types, utilities) between frontend and backend
- Single dependency management
- Coordinated versioning
- Simplified CI/CD

### Technology Decisions

**Frontend: Next.js 15**
- Server-side rendering for SEO
- App Router for modern React patterns
- Built-in optimizations (image, fonts)
- API routes capability

**Backend: NestJS**
- Modular architecture (easy to scale)
- Built-in DI container
- TypeScript-first
- Excellent BullMQ integration via @nestjs/bullmq

**ML Service: Flask (Python)**
- Lightweight and simple
- Access to scikit-learn, pandas, numpy
- Easy containerization
- Independent scaling

**Queue: BullMQ**
- Modern, actively maintained (vs Bull)
- TypeScript support
- Durability (Redis persistence)
- Delayed job scheduling (critical for STO)

## Phase 2: Core Email Infrastructure

### AWS SES Integration (`ses.service.ts`)

The `SesService` handles direct communication with AWS:

```typescript
async sendEmail(request: SendEmailRequest): Promise<string>
async getSendStatistics()
async getReputationMetrics()
```

**Key Concepts:**
1. **Configuration Sets**: Used to route events (opens, clicks, bounces) to SNS/EventBridge
2. **Event Publishing**: Real-time monitoring of email lifecycle
3. **Reputation Metrics**: Calculated bounce rate and complaint rate

**Cost Optimization:**
- Externalize images via CDN (reduces data transfer costs)
- Use text/html multipart (better compatibility without doubling size)
- Batch operations where possible

### Automated Warmup Guardian (`warmup.service.ts`)

Progressive volume increase schedule:

| Day | Max Emails |
|-----|-----------|
| 1   | 50        |
| 7   | 3,200     |
| 14  | 6,400     |
| 28  | 25,000    |
| 45  | 50,000    |

**Implementation:**
```typescript
getAllowedVolumeForDay(currentDay: number): number
canSendVolume(customerId, requestedVolume, currentDay, todaysSent)
getWarmupStatus(currentDay, totalSent, todaySent)
```

**Why This Matters:**
- ISPs monitor volume spikes
- Sudden increases = spam flag
- Gradual increase establishes trust
- Protects shared IP reputation

### BullMQ Email Queue

**Producer** (`email.service.ts`):
```typescript
await this.emailQueue.add('send-email', jobData, {
  delay: delayMs // STO timing
});
```

**Consumer** (`email.processor.ts`):
```typescript
@Processor('email')
class EmailProcessor {
  async process(job: Job<EmailJobData>) {
    // Actually send via SES
  }
}
```

**Benefits:**
- Decouples API from sending (fast responses)
- Automatic retries on failure
- Rate limiting built-in
- Persistent job storage

## Phase 3: AI/ML Integration

### Send Time Optimization Architecture

**Flow:**
1. User initiates campaign with `useSTO: true`
2. NestJS calls ML service: `POST /predict-sto`
3. ML service analyzes engagement profiles
4. Returns optimal hour for each recipient
5. NestJS converts to millisecond delays
6. BullMQ schedules individual sends

**ML Service (`app.py`):**

```python
def get_engagement_profile(email):
    # Returns hourly engagement distribution [0-23]
    # In production: query database
    # MVP: generate synthetic patterns

def calculate_optimal_hour(profile):
    # Find hour with max engagement probability
    return int(np.argmax(hourly_engagement))

def calculate_delay_ms(optimal_hour):
    # Convert to milliseconds from now
```

**Key Insight:**
The STO model doesn't need to be perfect initially. Even a 10-15% accuracy improvement over random timing translates to meaningful open rate gains. The continuous learning loop improves over time.

### Future: LLM Content Generation

**Architecture:**
```
Next.js ──→ NestJS ──→ OpenAI API
   (UI)      (Orchestration)  (Generation)
```

**Prompt Engineering:**
```typescript
const prompt = `
Generate email content in JSON format:
{"subject": "...", "body": "..."}

Context:
- Customer: ${customerData}
- Tone: Conversational, no hype
- Compliance: Include unsubscribe link

Generate now:
`;
```

## Phase 4: Frontend Excellence

### Design System (`globals.css`)

**Core Principles:**
1. **Dark Mode First**: Modern, premium feel
2. **Glassmorphism**: `backdrop-filter: blur(20px)`
3. **Gradient Accents**: Purple/pink brand identity
4. **Micro-animations**: Hover states, fade-ins
5. **Responsive**: Mobile-first approach

**CSS Variables:**
```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--bg-card: rgba(255, 255, 255, 0.05);
--shadow-glow: 0 0 40px rgba(102, 126, 234, 0.3);
```

**Component Pattern:**
```css
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

### Landing Page Strategy

1. **Hero Section**: Value prop + social proof (stats)
2. **Features**: Focus on AI differentiators (STO, LLM)
3. **Pricing**: Clear tiers, feature gating visible
4. **CTA**: Low friction ("No CC required")

**Conversion Optimization:**
- Stats prominently displayed ($0.115 CPT, 35% improvement)
- Premium badge on AI features
- "Most Popular" pricing tier highlighted
- Multiple CTAs (top, middle, bottom)

## Database Schema (TODO)

```sql
-- Users & Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  plan_tier VARCHAR(50), -- essentials, premium, enterprise
  created_at TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50)
);

-- Warmup Tracking
CREATE TABLE warmup_status (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  current_day INTEGER,
  start_date DATE,
  total_sent INTEGER,
  today_sent INTEGER,
  last_reset TIMESTAMP
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name VARCHAR(255),
  status VARCHAR(50), -- draft, scheduled, sending, complete
  use_sto BOOLEAN,
  created_at TIMESTAMP
);

-- Recipients & Engagement
CREATE TABLE recipients (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  email VARCHAR(255),
  metadata JSONB -- tags, custom fields
);

CREATE TABLE engagement_events (
  id UUID PRIMARY KEY,
  recipient_id UUID REFERENCES recipients(id),
  event_type VARCHAR(50), -- open, click, bounce, complaint
  timestamp TIMESTAMP,
  hour_of_day INTEGER, -- for STO training
  metadata JSONB
);

-- Indexes for STO queries
CREATE INDEX idx_engagement_recipient ON engagement_events(recipient_id);
CREATE INDEX idx_engagement_hour ON engagement_events(hour_of_day);
```

## Next Steps

### Immediate (Week 1-2)
1. Set up PostgreSQL migrations
2. Implement user authentication (Auth0 or Passport.js)
3. Create campaign creation UI
4. Build recipient management

### Short-term (Month 1)
1. CloudWatch alarm integration
2. Auto-pause on reputation threshold
3. Customer dashboard with analytics
4. Stripe payment integration

### Medium-term (Months 2-3)
1. Email template builder
2. A/B testing framework
3. Advanced segmentation
4. Webhook system for events

### Long-term (Months 4-6)
1. Model retraining pipeline
2. Multi-tenant isolation
3. White-label option
4. Mobile app

## Production Checklist

- [ ] Environment variables properly configured
- [ ] Database migrations tested
- [ ] Redis persistence enabled
- [ ] AWS SES out of sandbox mode
- [ ] Domain authentication verified (SPF/DKIM/DMARC)
- [ ] CloudWatch alarms configured
- [ ] Rate limiting on API endpoints
- [ ] HTTPS enforced
- [ ] Backup strategy implemented
- [ ] Monitoring & logging (Datadog/New Relic)
- [ ] Error tracking (Sentry)
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] GDPR compliance verified
- [ ] Terms of service & privacy policy published

## Key Metrics to Track

### Technical
- Email delivery rate (target: >99%)
- Bounce rate (target: <2%)
- Complaint rate (target: <0.1%)
- API response time (target: <200ms)
- Queue processing time
- ML service latency

### Business
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)
- Emails sent per customer
- STO adoption rate

## Common Pitfalls

1. **IP Warmup**: Don't skip this. One spam report can blacklist you.
2. **Database N+1**: Use eager loading for recipients
3. **Redis Memory**: Monitor queue sizes, implement TTL
4. **ML Service**: Add timeout handling, fallback to non-STO
5. **Rate Limits**: AWS SES has sending limits (start: 14 emails/sec)
6. **Timezone Handling**: Always UTC in backend, convert in frontend

## Debugging Tips

**Email not sending?**
1. Check AWS credentials
2. Verify domain is verified in SES
3. Check SES sending limits
4. Look at BullMQ failed jobs
5. Review CloudWatch logs

**STO not working?**
1. Confirm ML service is running (`curl localhost:5000/health`)
2. Check network connectivity from NestJS to ML service
3. Review job delay values in Redis
4. Verify BullMQ scheduler is running

**High bounce rate?**
1. Implement email validation (regex, MX record check)
2. Remove hard bounces immediately
3. Suppress previously bounced addresses
4. Use double opt-in for signups

---

This platform represents the convergence of cost arbitrage (AWS SES) and proprietary technology (ML-driven optimization). The competitive moat is the combination of both - neither alone is sufficient.
