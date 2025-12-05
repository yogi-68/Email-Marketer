# 📂 Project Structure

```
email-marketer/
│
├── apps/                          # Application workspaces
│   ├── web/                       # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── globals.css    # Design system & CSS variables
│   │   │   │   ├── layout.tsx     # Root layout
│   │   │   │   ├── page.tsx       # Landing page
│   │   │   │   └── page.module.css
│   │   │   └── components/        # Reusable React components (TODO)
│   │   ├── public/                # Static assets
│   │   ├── Dockerfile             # Production containerization
│   │   ├── env.example.txt        # Environment template
│   │   └── package.json
│   │
│   ├── api/                       # NestJS Backend
│   │   ├── src/
│   │   │   ├── email/             # Email module (core feature)
│   │   │   │   ├── email.module.ts
│   │   │   │   ├── email.service.ts       # Orchestration & BullMQ producer
│   │   │   │   ├── email.controller.ts    # REST API endpoints
│   │   │   │   ├── email.processor.ts     # BullMQ consumer/worker
│   │   │   │   ├── ses.service.ts         # AWS SES integration
│   │   │   │   └── warmup/
│   │   │   │       └── warmup.service.ts  # Automated warmup logic
│   │   │   ├── app.module.ts      # Root application module
│   │   │   ├── app.controller.ts
│   │   │   ├── app.service.ts
│   │   │   └── main.ts            # Application entry point
│   │   ├── test/                  # E2E tests
│   │   ├── Dockerfile             # Production containerization
│   │   ├── .env.example           # Environment template
│   │   └── package.json
│   │
│   └── ml/                        # Python ML Service
│       ├── app.py                 # Flask application & STO logic
│       ├── requirements.txt       # Python dependencies
│       └── Dockerfile             # Production containerization
│
├── packages/                      # Shared packages
│   └── shared/                    # Shared TypeScript types
│       ├── src/
│       │   └── index.ts           # Exported types & utilities
│       ├── tsconfig.json
│       └── package.json
│
├── docker-compose.yml             # Local development infrastructure
├── package.json                   # Root workspace configuration
├── README.md                      # Project overview & quick start
├── WALKTHROUGH.md                 # Detailed implementation guide
├── DEPLOYMENT.md                  # Production deployment guide
├── API_TESTING.md                 # API testing examples
└── .gitignore
```

## 🎯 Key Files Explained

### Frontend (Next.js)

**`apps/web/src/app/globals.css`**
- Complete design system with CSS variables
- Dark mode color palette
- Glassmorphism components
- Typography system
- Utility classes
- Responsive breakpoints
- Animation keyframes

**`apps/web/src/app/page.tsx`**
- Landing page with hero section
- Feature showcase (STO, Warmup, LLM)
- Pricing tiers (Essentials, Premium, Enterprise)
- Conversion-optimized CTAs

### Backend (NestJS)

**`apps/api/src/email/email.service.ts`** (Orchestration Layer)
- `queueEmail()`: Enqueue single email
- `queueBulkEmails()`: Handle campaigns with warmup checks
- `fetchSTOTimes()`: Call ML service for predictions
- `personalizeContent()`: Replace template variables

**`apps/api/src/email/email.processor.ts`** (Worker)
- Consumes jobs from BullMQ queue
- Calls `sesService.sendEmail()`
- Implements retry logic
- Logs success/failure

**`apps/api/src/email/ses.service.ts`** (AWS Integration)
- Direct SES API communication
- `sendEmail()`: Send via AWS SES
- `getSendStatistics()`: Pull reputation metrics
- `getReputationMetrics()`: Calculate bounce/complaint rates

**`apps/api/src/email/warmup/warmup.service.ts`** (Guardian)
- `getAllowedVolumeForDay()`: Get daily limit
- `canSendVolume()`: Validate against warmup schedule
- `getWarmupStatus()`: Return current state
- `validateDomainAuthentication()`: Check SPF/DKIM/DMARC

**`apps/api/src/email/email.controller.ts`** (REST API)
- `POST /email/send-bulk`: Queue campaign
- `GET /email/reputation`: Get metrics
- `GET /email/warmup/:customerId`: Get warmup status

**`apps/api/src/app.module.ts`** (Root Module)
- Configures BullModule with Redis connection
- Imports EmailModule
- Sets up global providers

### ML Service (Python/Flask)

**`apps/ml/app.py`**
- `GET /health`: Health check endpoint
- `POST /predict-sto`: Send time optimization
  - Analyzes engagement profiles
  - Calculates optimal hour (0-23)
  - Returns confidence scores
  - Computes delay in milliseconds

## 🔄 Data Flow

### Campaign Send Flow
```
1. User → Next.js UI → Submit campaign
2. Next.js → POST /email/send-bulk → NestJS API
3. NestJS → Warmup check → Validate volume
4. NestJS → ML Service → Get STO predictions (if enabled)
5. NestJS → BullMQ → Queue individual jobs with delays
6. BullMQ Worker → SES Service → AWS SES API
7. AWS SES → SNS Events → Real-time tracking
```

### Warmup Enforcement Flow
```
1. Campaign request arrives
2. Lookup customer warmup status (day, today_sent)
3. Calculate allowed volume for current day
4. If requested > allowed → Reject with error
5. If OK → Increment today_sent counter
6. Queue jobs
```

### STO Prediction Flow
```
1. NestJS collects recipient emails
2. HTTP POST to ML service /predict-sto
3. ML service:
   - Loads engagement profile for each email
   - Calculates hourly engagement distribution
   - Finds optimal hour (argmax)
   - Computes delay from current time
4. Returns predictions array
5. NestJS maps predictions to BullMQ job delays
6. Jobs execute at optimal times
```

## 🗄️ Database Schema (TODO)

### Tables to Implement

**organizations**
- id, name, plan_tier, created_at

**users**
- id, org_id, email, role, created_at

**warmup_status**
- org_id (PK), current_day, start_date, total_sent, today_sent, last_reset

**campaigns**
- id, org_id, name, status, use_sto, created_at

**recipients**
- id, org_id, email, metadata (JSONB)

**engagement_events**
- id, recipient_id, event_type, timestamp, hour_of_day, metadata

**bounce_suppressions**
- email, bounce_type, first_bounced_at

## 🔐 Environment Variables

### Backend Required
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `ML_SERVICE_URL`

### Frontend Required
- `NEXT_PUBLIC_API_URL`

## 🧪 Testing Strategy

### Unit Tests
- Service logic (email.service.spec.ts)
- Warmup calculations
- STO delay calculations

### Integration Tests
- BullMQ job processing
- AWS SES mocking
- Database operations

### E2E Tests
- Full campaign flow
- API endpoint testing
- Error handling

## 📊 Monitoring Points

### Backend Metrics
- Queue length (BullMQ)
- Job processing rate
- Failed jobs count
- API response times
- Database query performance

### Email Metrics
- Delivery rate
- Bounce rate
- Complaint rate
- Open rate (if tracking pixels enabled)
- Click rate (if link tracking enabled)

### Business Metrics
- Campaigns sent per day
- Total email volume
- STO adoption rate
- Customer tier distribution
- Revenue per customer

## 🚀 Development Workflow

### Starting Development
```bash
# Terminal 1: Infrastructure
docker-compose up

# Terminal 2: Backend
cd apps/api
npm run start:dev

# Terminal 3: Frontend
cd apps/web
npm run dev

# Terminal 4: ML Service
cd apps/ml
python app.py
```

### Making Changes

**Backend:**
1. Modify code in `apps/api/src/`
2. NestJS auto-reloads
3. Test with curl or Postman

**Frontend:**
1. Modify code in `apps/web/src/`
2. Next.js hot reloads
3. View at localhost:3000

**ML Service:**
1. Modify `apps/ml/app.py`
2. Restart manually: `python app.py`
3. Test with curl

### Before Committing
```bash
# Build all projects
npm run build --workspaces

# Run linters
npm run lint --workspaces

# Run tests
npm run test --workspaces
```

## 📝 Code Style

### TypeScript
- Use functional components (React)
- Prefer async/await over promises
- Use dependency injection (NestJS)
- Type everything (no `any`)
- Use interfaces for public APIs

### Python
- Follow PEP 8
- Use type hints
- Document functions with docstrings
- Keep functions small and focused

### CSS
- Use CSS variables for theming
- Mobile-first responsive design
- Use BEM naming for custom classes
- Leverage utility classes from globals.css

## 🎨 Design System

### Colors
- Primary: Purple gradient (#667eea → #764ba2)
- Secondary: Pink gradient (#f093fb → #f5576c)
- Success: Cyan gradient (#4facfe → #00f2fe)

### Typography
- Font: Inter (Google Fonts)
- Weights: 300, 400, 500, 600, 700, 800

### Spacing Scale
- xs: 0.5rem (8px)
- sm: 1rem (16px)
- md: 1.5rem (24px)
- lg: 2rem (32px)
- xl: 3rem (48px)
- 2xl: 4rem (64px)

### Components
- Glass cards: `backdrop-filter: blur(20px)`
- Buttons: Gradient backgrounds with hover animations
- Inputs: Dark background with purple focus ring

---

This structure balances **separation of concerns** (frontend/backend/ML) with **code sharing** (packages/shared) while maintaining **independent deployability** (Docker) and **development velocity** (monorepo).
