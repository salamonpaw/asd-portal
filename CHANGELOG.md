# Changelog

All notable changes to ASD Partner Portal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-10

### Added
- **Service Order Management System**
  - Create, read, update service orders with SRV-YYYY-XXXX code generation
  - Service order items tracking with product selection
  - Order status workflow (NOWE, ZAAKCEPTOWANE, ODRZUCONE, ZREALIZOWANE)
  - Service order history audit trail with user tracking

- **Role-Based Authentication & Authorization**
  - Complete NextAuth.js v4 JWT session strategy implementation
  - Support for 6 user roles: ADMIN, STAFF, PARTNER, SALES_REP, SERVICE_TECHNICIAN, WAREHOUSE_SPECIALIST
  - Middleware-based route protection with role-based redirects
  - Proper session type declarations (types/next-auth.d.ts)

- **Warehouse & Service Specialist Dashboards**
  - Warehouse specialist view for managing service orders
  - Service technician view for creating and tracking orders
  - Real-time order status management interface

- **Product & Machine Type Management**
  - Admin interface for managing products with machine type associations
  - Machine type CRUD operations
  - Product inventory and pricing management

- **Comprehensive Type Safety Refactoring**
  - Unified `ActionResult<T>` type system for all server actions
  - Proper TypeScript types for Prisma models
  - Removed 55+ unsafe `as any` casts for session access
  - Proper null checks for optional session fields

- **Configuration & Environment**
  - Centralized portal URL configuration (lib/config.ts)
  - Secure NEXTAUTH_SECRET management
  - Environment-based configuration system

### Fixed
- Service order history now properly captures user email from session (changedBy field)
- Portal URL consolidated across email notifications and redirects
- JWT callbacks now preserve all session fields (id, email, role, partnerId, repId) through token cycle
- Type safety: ActionResult<T> properly discriminates success/failure cases
- Type safety: Session.user now properly typed instead of using `as any` casts
- Null checks added for optional session fields (partnerId, repId)
- Prisma type imports fixed (replaced typeof import() patterns)
- Decimal vs number type mismatches resolved for product pricing

### Changed
- Auth system simplified to only store role in JWT, fetch other data server-side on demand
- Session callback updated to include all necessary user fields for proper authorization
- All server actions now use standardized ActionResult<T> return type
- Error handling patterns standardized across all actions (consistency instead of scattered patterns)

### Tech Stack
- **Frontend**: Next.js 16 (App Router, Turbopack)
- **Backend**: Next.js 16 (Server Actions, API Routes)
- **Database**: PostgreSQL + Prisma 7 ORM
- **Authentication**: NextAuth.js v4 with JWT strategy
- **Styling**: CSS Variables, responsive design
- **Deployment**: Docker Compose with PostgreSQL + Redis
- **Type Safety**: TypeScript strict mode, proper NextAuth type extensions

### Database
- Service order management schema (ServiceOrder, ServiceOrderItem, ServiceOrderHistory)
- Product and machine type models
- Full user role hierarchy
- Partner relationship tracking

### Known Limitations
- UI/UX for service orders dashboard still in MVP stage (functionality complete, styling to be enhanced)
- Email notifications ready but SMTP configuration pending (requires Office 365 credentials from IT)
- Redis caching infrastructure ready but not yet fully integrated

### Breaking Changes
None - first production release

---

## Legend

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for any security improvements
