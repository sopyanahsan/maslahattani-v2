# Maslahat Tani v2 — POS & BRILink System

Aplikasi terintegrasi untuk Agen BRILink dengan retail store, dibangun dengan modern tech stack untuk scalability, reliability, dan market-ready deployment.

**Repository**: [sopyanahsan/maslahattani-v2](https://github.com/sopyanahsan/maslahattani-v2)

---

## 📋 Dokumentasi

- **[PRD.md](./PRD.md)** — Product Requirements Document (lengkap)
- **[.kiro/steering/](./.kiro/steering/)** — Development guidelines & rules

---

## 🏗️ Project Structure

```
maslahat-tani-v2/
├── backend/                 # NestJS Backend API
│   ├── src/
│   │   ├── main.ts         # Entry point
│   │   ├── app.module.ts   # Root module
│   │   ├── prisma/         # Database service
│   │   ├── auth/           # Auth module (Step 1)
│   │   └── ...             # Other modules
│   ├── prisma/             # Prisma schema & migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Nuxt 3 Frontend (Admin + Kasir)
│   ├── src/
│   │   ├── app.vue
│   │   ├── pages/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── composables/
│   │   └── assets/
│   ├── nuxt.config.ts
│   ├── Dockerfile
│   └── package.json
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Full stack setup
├── PRD.md
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Node.js 22+ (untuk development lokal)
- PostgreSQL 14+ (jika ga pakai Docker)
- Redis 7+ (jika ga pakai Docker)

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/sopyanahsan/maslahattani-v2.git
cd maslahattani-v2

# Start full stack (backend + postgres + redis)
docker-compose up -d

# Wait for services to be ready (~30 seconds)
sleep 30

# Run migrations (first time only)
docker-compose exec backend npm run prisma:migrate:deploy

# Verify setup
curl http://localhost:3000/api/health  # Backend health check
curl http://localhost:3001             # Frontend health check (if running)
```

Access:
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Frontend** (later): http://localhost:3001

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup .env
cp .env.example .env
# Edit .env with your local database credentials

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

Backend running at: http://localhost:3000

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend running at: http://localhost:3000 (Nuxt default)

---

## 🔧 Development Commands

### Backend

```bash
cd backend

# Development
npm run start:dev          # Watch mode with hot reload
npm run start:debug        # Debug mode

# Building
npm run build              # Compile TypeScript

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Create new migration
npm run prisma:migrate:deploy  # Deploy migrations
npm run prisma:studio      # Open Prisma Studio (UI for database)

# Testing & Linting
npm run lint               # ESLint
npm run test               # Jest
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
```

### Frontend

```bash
cd frontend

# Development
npm run dev                # Dev server with hot reload
npm run build              # Build for production
npm run preview            # Preview production build

# Linting & Testing
npm run lint               # ESLint with auto-fix
npm run test               # Vitest
npm run test:run           # Single run
```

---

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js 22 LTS
- **Framework**: NestJS 10 + TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Authentication**: JWT + Passport
- **Cache**: Redis 7
- **Validation**: Class-validator, Joi
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **API Docs**: Swagger (OpenAPI)

### Frontend
- **Framework**: Nuxt 3 (Vue 3 + Vite)
- **Styling**: Tailwind CSS
- **Components**: Radix Vue
- **State**: Pinia
- **HTTP Client**: Axios
- **Form Validation**: VeeValidate
- **Offline**: IndexedDB
- **Sync**: TanStack Query
- **Testing**: Vitest, Vue Test Utils
- **Icons**: Lucide Vue

### DevOps
- **VCS**: GitHub
- **CI/CD**: GitHub Actions
- **Container**: Docker & Docker Compose
- **Cloud**: VPS (DigitalOcean, Linode, custom)

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME="Maslahat Tani v2"
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT (change in production!)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=86400
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRATION=2592000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
```

### Frontend (.env)

```env
NUXT_PUBLIC_API_BASE=http://localhost:3000/api
```

---

## 📚 API Documentation

Swagger documentation available at: **http://localhost:3000/api/docs**

### Core Endpoints (Phase 1)

#### Authentication
- `POST /api/auth/register-kasir` - Kasir register via email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Forgot password request
- `POST /api/auth/reset-password` - Reset password

#### Admin Only
- `GET /api/admin/kasir` - List all cashiers
- `POST /api/admin/kasir` - Create new cashier
- `PUT /api/admin/kasir/:id` - Update cashier
- `POST /api/admin/kasir/:id/reset-password` - Reset cashier password

More endpoints coming in Phase 1 (Transactions, Stock, Payments, etc.)

---

## 🧪 Testing

### Backend

```bash
cd backend

# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

### Frontend

```bash
cd frontend

# Run all tests
npm run test:run

# Watch mode
npm run test

# UI mode
npm run test -- --ui
```

---

## 🚢 Deployment

### Staging

```bash
# Push to develop branch
git push origin feature-branch
git checkout develop
git merge feature-branch
git push origin develop

# GitHub Actions will automatically:
# 1. Run lint & tests
# 2. Build Docker images
# 3. (Future) Deploy to staging server
```

### Production

```bash
# Create release
git checkout main
git pull origin develop
git merge develop
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin main --tags

# GitHub Actions will:
# 1. Run all checks
# 2. Build & push Docker images
# 3. (Future) Deploy to production VPS
```

---

## 📈 Development Roadmap

### Phase 1: MVP (Week 1-10)
- ✅ Infrastructure setup
- 🔄 **Authentication** (in progress)
- Transaction system (retail POS)
- Stock management
- Payment & cash management
- Shift settlement & clerek
- Admin settings

### Phase 2: Expansion (Week 11+)
- BRILink integration
- Advanced stock management
- Mobile APK (Capacitor)
- Analytics & reporting
- Supplier management

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify connection
docker-compose exec postgres psql -U maslahat -d maslahat_tani -c "SELECT 1"

# Reset database (⚠️ data loss!)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend npm run prisma:migrate:deploy
```

### Backend Crashes

```bash
# Check logs
docker-compose logs -f backend

# Rebuild container
docker-compose down backend
docker-compose up -d backend

# Or locally:
npm run start:dev  # Will show errors in real-time
```

### Frontend Build Issues

```bash
# Clear cache
rm -rf node_modules .nuxt
npm install

# Rebuild
npm run build
npm run preview
```

---

## 📝 Contributing

1. **Create feature branch**: `git checkout -b feature/auth-module`
2. **Follow code style**: Run `npm run lint` before commit
3. **Write tests**: Every feature needs tests
4. **Submit PR**: Link to issue (if any)
5. **Merge**: After review & all checks pass

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details

---

## 👤 Author

**Sopyan Ahsan** — [GitHub](https://github.com/sopyanahsan)

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/sopyanahsan/maslahattani-v2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sopyanahsan/maslahattani-v2/discussions)
- **Email**: (add if needed)

---

**Last Updated**: May 2026
