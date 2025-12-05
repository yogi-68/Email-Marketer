# Quick Start Script for Email Marketing SaaS

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Email Marketing SaaS - Quick Start Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check Docker installation
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠ Docker not found. You'll need Docker for infrastructure services" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 2: Building Shared Package" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

npm run build --workspace=packages/shared
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to build shared package" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Shared package built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 3: Environment Configuration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if .env files exist
$apiEnvExists = Test-Path "apps/api/.env"
if (-not $apiEnvExists) {
    Write-Host "⚠ No .env file found in apps/api/" -ForegroundColor Yellow
    Write-Host "  Copy apps/api/.env.example to apps/api/.env and configure your AWS credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ API .env file exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Step 4: Starting Infrastructure (Docker)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

try {
    Write-Host "Starting PostgreSQL, Redis, and ML service..." -ForegroundColor Yellow
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Infrastructure services started" -ForegroundColor Green
    } else {
        Write-Host "⚠ Docker Compose failed. You can start services manually later" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not start Docker services. Make sure Docker is running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Configure environment variables:" -ForegroundColor White
Write-Host "   - Copy apps/api/.env.example to apps/api/.env" -ForegroundColor Gray
Write-Host "   - Add your AWS SES credentials" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the development servers:" -ForegroundColor White
Write-Host "   Terminal 1:  cd apps/api && npm run start:dev" -ForegroundColor Cyan
Write-Host "   Terminal 2:  cd apps/web && npm run dev" -ForegroundColor Cyan
Write-Host "   Terminal 3:  cd apps/ml && python app.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access the platform:" -ForegroundColor White
Write-Host "   Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   ML Service:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. View the dashboard:" -ForegroundColor White
Write-Host "   Navigate to: http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Happy Coding! 🚀" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
