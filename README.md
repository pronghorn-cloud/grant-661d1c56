# AE Online Scholarships (DMND0019218)

Government of Alberta - Advanced Education Online Scholarships & Part-Time Applications.

## Tech Stack

- **Frontend**: Vue.js 3 + Vite, GoA Design System web components
- **Backend**: Node.js + Express.js (ESM)
- **Database**: PostgreSQL 17 (Supabase) - schema `ae_scholarships`

## Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase project)

## Setup

### 1. Clone and install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Copy the example files and fill in your values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (use a strong random value)
- `VITE_API_URL` - Frontend API base URL

### 3. Run database migrations

The database schema is managed in the `ae_scholarships` schema. Seed scripts are in `backend/scripts/`.

### 4. Start development servers

```bash
# Backend (port 3000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### 5. Build for production

```bash
cd frontend && npm run build
```

Output goes to `frontend/dist/`.

## Project Structure

```
backend/
  src/
    config/        # Database, app configuration
    controllers/   # Request handlers
    middleware/     # Auth, error handling
    routes/        # API route definitions
    services/      # Business logic
  scripts/         # Seed data, test scripts

frontend/
  src/
    components/    # Reusable Vue components
    services/      # API service modules
    views/         # Page components
    router/        # Vue Router configuration
```

## API Endpoints

| Module | Route Prefix | Auth |
|--------|-------------|------|
| Auth | `/api/auth` | Public (dev-login) |
| Scholarships | `/api/scholarships` | Public |
| Profile | `/api/profile` | Applicant |
| Applications | `/api/applications` | Applicant |
| Notifications | `/api/notifications` | Authenticated |
| Staff | `/api/staff` | Staff roles |
| COR | `/api/cor` | Staff (public for responses) |
| Payments | `/api/payments` | Staff/Finance |
| Admin | `/api/admin` | Admin only |
| Analytics | `/api/analytics` | Staff roles |

## Roles

- `applicant` - Students applying for scholarships
- `scholarship_staff` - Process applications
- `scholarship_manager` - Manage staff, approve decisions
- `finance` - Payment processing
- `admin` / `superadmin` - Full system access

## Environment Variables

See `.env.example` for the full list. Required for production:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `FRONTEND_URL` | Production frontend URL (for CORS) |
| `VITE_API_URL` | API base URL for frontend |

## Testing

```bash
# Run all integration tests (requires backend running)
cd backend && node scripts/test-integration.js
```

Test coverage: 96 API endpoint tests across auth, scholarships, profiles, applications, staff, COR, payments, admin, audit, analytics, and user flow scenarios.
