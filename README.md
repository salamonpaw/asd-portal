# ASD Partner Portal

**Service Order Management System** — Portal Partnerów ASD Systems dla zarządzania projektami i zamówieniami serwisowymi.

## 📋 Opis

Portal umożliwia partnerom, handlowcom i specjalistom serwisu zarządzanie:
- **Zamówieniami serwisowymi** — tworzenie, śledzenie, zarządzanie statusem
- **Produktami i częściami** — katalog dostępnych części zamiennych
- **Relacjami z klientami** — rejestr projektów, ochrona z datą wygaśnięcia
- **Raportowaniem** — historia zmian, audit trail

## 🚀 Quick Start

### Wymagania
- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Docker + Docker Compose** (opcjonalnie do produkcji)
- **Git**

### Setup (Development)

```bash
# 1. Clone repo
git clone https://github.com/salamonpaw/asd-portal.git
cd asd-portal

# 2. Install dependencies
npm install

# 3. Setup .env.local
cp .env.example .env.local
# Edit .env.local - config bazy danych, NEXTAUTH_SECRET, itd.

# 4. Database setup
npx prisma migrate dev
npx prisma db seed

# 5. Start dev server
npm run dev
```

Server będzie dostępny na `http://localhost:3000`

### Test Accounts (Development)

```
Partner:      p.nowak@vendmax.pl / demo1234
Handlowiec:   m.kowalczyk@asdsystems.pl / demo1234
Admin Demo:   admin@asdsystems.pl / demo1234
Serwisant:    serwisant@test.pl / demo1234
Magazynier:   magazynier@test.pl / demo1234
```

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router, Turbopack) |
| **Backend** | Next.js 16 (Server Actions, API Routes) |
| **Database** | PostgreSQL 14+ + Prisma 7 ORM |
| **Auth** | NextAuth.js v4 (JWT strategy) |
| **Styling** | CSS Variables, responsive design |
| **Deployment** | Docker Compose, Nginx |

## 📁 Struktura Projektu

```
portal/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Public auth pages (login)
│   └── (portal)/            # Protected portal pages
│       ├── admin/           # Admin dashboard
│       ├── partner/         # Partner dashboard
│       ├── staff/           # Staff (handlowiec) dashboard
│       └── warehouse/       # Warehouse specialist dashboard
├── lib/
│   ├── actions/             # Server actions (service-orders, orders, projects, etc.)
│   ├── auth.ts              # NextAuth configuration
│   ├── config.ts            # Centralized configuration
│   ├── db.ts                # Prisma client
│   └── types/               # Type definitions
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Database seeding
│   └── migrations/          # Prisma migrations
├── types/                   # Global TypeScript types
│   └── next-auth.d.ts       # NextAuth type extensions
├── middleware.ts            # Route protection + role-based redirects
├── docker-compose.yml       # Docker Compose configuration
├── CHANGELOG.md             # Release notes
├── DEPLOYMENT.md            # Production deployment guide
└── VERSION                  # Current version (0.1.0)
```

## 🔐 Authentication & Authorization

### Roles
- **ADMIN** — Pełny dostęp do systemu, zarządzanie użytkownikami
- **STAFF** — Handlowiec, zarządzanie projektami partnerów
- **PARTNER** — Partner, zarządzanie własnymi projektami
- **SALES_REP** — Reprezentant sprzedaży
- **SERVICE_TECHNICIAN** — Serwisant, tworzenie zamówień na części
- **WAREHOUSE_SPECIALIST** — Magazynier, realizacja zamówień

### Flow
1. **Login** — `/login` (Credentials Provider)
2. **JWT Token** — Przechowuje role, id, email w JWT
3. **Session** — NextAuth session callback pobiera role z token
4. **Middleware** — `middleware.ts` chroni routes i rediryguje na dashboardy
5. **Server Actions** — Pobranie `session` via `getServerSession()` do walidacji uprawnień

## 📦 Konfiguracja

### `.env.local` — Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/asd_portal_prod
DB_USER=asd_portal_user
DB_PASSWORD=your_secure_password
DB_NAME=asd_portal_prod
DB_PORT=5432

# NextAuth
NEXTAUTH_SECRET=your_secret_key_change_this
NEXTAUTH_URL=http://localhost:3000

# Redis (opcjonalnie)
REDIS_PORT=6379

# Email (SMTP) — Optional, będzie wymagane do wysyłania notyfikacji
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-office365-email@asdsystems.pl
SMTP_PASS=your-office365-app-password

# Business
ORDER_FORM_URL=https://sales.asdsystems.pl/
PORTAL_URL=http://localhost:3000
APP_PORT=3000
```

### Generowanie NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## 🗄️ Database

### Uruchomienie PostgreSQL (Docker)

```bash
docker run -d \
  --name asd-postgres \
  -e POSTGRES_USER=asd_portal_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=asd_portal_prod \
  -p 5432:5432 \
  postgres:14-alpine
```

### Migracje

```bash
# Run pending migrations
npx prisma migrate dev

# View database
npx prisma studio
```

### Seeding (Development)

```bash
npx prisma db seed
```

Tworzy test użytkowników, produkty, maszyny, itd.

## 🚀 Production Deployment

Szczegółowe instrukcje: [DEPLOYMENT.md](./DEPLOYMENT.md)

Krótko:
1. Przygotuj `.env` na VM
2. Uruchom `docker-compose up -d`
3. Run migrations: `docker-compose exec portal npx prisma migrate deploy`
4. Verify: `curl http://vm-ip:app-port/api/auth/session`

## 🧪 Testing

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Type Checking

```bash
npx tsc --noEmit
```

## 📝 Commit Message Format

```
type: description

[optional body]

Co-Authored-By: Name <email>
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code refactoring
- `docs:` — Documentation
- `chore:` — Build, config, dependencies
- `test:` — Tests

## 🔄 Release Process

1. **Develop** na gałęzi `feature/*`
2. **Test** — npm run build, manual testing
3. **Merge** — PR do `main`
4. **Tag** — `git tag -a v0.1.0 -m "..."`
5. **Push** — `git push origin main && git push origin v0.1.0`
6. **Deploy** — Run DEPLOYMENT.md steps na VM

Zmienne wersji:
- `package.json` — `version`
- `VERSION` — text file z numerem
- `CHANGELOG.md` — Release notes

## 📚 Dokumentacja

- [CHANGELOG.md](./CHANGELOG.md) — Co jest nowego w każdej wersji
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Instrukcje deployment na VM
- [DEPLOY_VM.md](./DEPLOY_VM.md) — 9-fazowy proces deployment (legacy)

## 🐛 Known Issues & Limitations

- UI/UX dla service orders dashboard — MVP stage (funkcjonalność OK, styling to later)
- Email notifications — ready, czeka na SMTP config (Office 365 creds)
- Redis caching — infrastructure ready, not fully integrated
- Hydration warning (browser extension) — safe to ignore

## 👥 Team

- **Product Owner** — Paweł Sałamon
- **Development** — Claude Code (Anthropic)

## 📄 License

Proprietary — ASD Systems

---

**Current Version:** 0.1.0 (See [CHANGELOG.md](./CHANGELOG.md))

**Last Updated:** 2026-06-11
