# Dziennik Zmian

Wszystkie istotne zmiany w ASD Partner Portal będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
projekt przestrzega [Wersjonowania Semantycznego](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-06-22

### Dodane
- **Improved warehouse order pricing UI**
  - Column headers dla cen, rabatów, razem
  - Better visual layout dla pricing inputs
  - Auto-fill rabatu z partner discount level
  - Cleaner input organization

### Zmienione
- Warehouse order item pricing — refactored layout
- Better visual feedback dla pricing fields
- Partner discount automatically applied when opening order

---

## [0.3.0] - 2026-06-22

### Dodane
- **Zarządzanie rabatami na poziomie partnera**
  - Model `PartnerProductDiscount` — rabat dla partnera na konkretny produkt
  - Admin panel do przypisywania rabatów per partner
  - Auto-apply rabatu z partnera w zamówieniach magazyniera
  - Tracking ostatniego zamówienia od partnera

- **Verification notifications**
  - Komunikat: "Brak zamówień przez ostatni rok — zweryfikuj rabat"
  - Highlight rabatów do weryfikacji
  - Admin może szybko zmienić rabat

### Zmienione
- Warehouse order pricing now includes partner discount level
- Partner discount auto-applied w pricing calculations
- Enhanced order management z discount verification

---

## [0.2.9] - 2026-06-22

### Dodane
- **Form validation — lepsze komunikaty błędów**
  - Validation na formach tworzenia/edycji zamówień
  - Validation cen (cena sprzedaży >= cena zakupu)
  - Validation ilości (musi być > 0)
  - Validation adresu dostawy (nie może być puste)
  - Clear error messages pod każdym polem
  - Required field indicators (*)

### Zmienione
- Ulepszone komunikaty błędów na formach
- Lepszy feedback podczas wypełniania formularzy
- Field-level validation z natychmiastowym feedbackiem

---

## [0.2.8] - 2026-06-22

### Dodane
- **Error handling i error pages**
  - Error boundary component dla client-side errors
  - Custom error page dla 404 (nie znaleziono)
  - Custom error page dla 500 (błąd serwera)
  - Helpful error messages z action buttons
  - Consistent error styling across app

### Zmienione
- Lepsze komunikaty błędów
- Error pages z linkami do głównych sekcji

---

## [0.2.7] - 2026-06-22

### Dodane
- **Loading states — Skeleton screens**
  - Skeleton component dla stat cards
  - Skeleton dla list items (zamówienia, produkty)
  - Smooth pulse animation
  - Lepsze UX podczas ładowania danych

### Zmienione
- Dashboard'y teraz pokazują skeletons podczas ładowania
- List pages pokazują placeholder'y podczas ładowania

---

## [0.2.6] - 2026-06-22

### Naprawione
- Ikony w stat card'ach — widoczność i kontrast
  - Zmieniony background z brand-soft na brand (ciemniejszy)
  - Ikony teraz białe zamiast brand-colored
  - Powiększone ikony i container dla lepszej widoczności
  - Lepszy kontrast na jasnych ekranach

---

## [0.2.5] - 2026-06-22

### Dodane
- **Empty states — lepsze komunikaty**
  - Ikony i opisy gdy brak danych na liście
  - Call-to-action buttons dla pustych stanów
  - Konsystentny design pustych widoków
  - Wiadomości dla: zamówień, produktów, zdjęć, pozycji

### Zmienione
- Ulepszone komunikaty w wynikach wyszukiwania
- Lepszy UX dla nowych użytkowników

---

## [0.2.4] - 2026-06-22

### Dodane
- **Szczegółowa strona zamówienia serwisowego**
  - /warehouse/orders/[id] — widok szczegółów dla magazyniera
  - Breadcrumbs nawigacji: Zamówienia → [KOD]
  - Pełne informacje o zamówieniu (status, partnerze, technikowie)
  - Lista pozycji z cenami, rabatami, ilościami
  - Podsumowanie finansowe (suma, rabaty, razem do zapłaty)
  - Historia zmian statusu zamówienia

### Zmienione
- Link do szczegółów zamówienia w liście (WarehouseOrdersClient)

---

## [0.2.3] - 2026-06-22

### Dodane
- **Responsywny design na urządzenia mobilne**
  - Przystosowanie dashboardów do małych ekranów
  - Elastyczne grid'i i tabelki na telefonach
  - Poprawione menu nawigacyjne
  - Szybsze ładowanie na wolnych połączeniach

### Zmienione
- Poszerzone breakpoint'y CSS dla tabletów i telefonów
- Lepsze rozmieszczenie kart statystyk na urządzeniach mobilnych

---

## [0.2.2] - 2026-06-22

### Added
- **Dashboard with role-based statistics**
  - Warehouse Specialist: Order count, priced items, products in stock
  - Service Technician: Active orders, pending pricing, recent orders
  - Admin: Total orders, total products, users count
  - Real-time stats with proper formatting (PLN currency, counts)
  - Recent items preview (last 5 orders/products)

### Changed
- Root redirect now shows role-specific dashboard instead of blank screen
- Improved visual consistency for stat cards

---

## [0.2.1] - 2026-06-22

### Added
- **Breadcrumb navigation** on product details page
  - Shows: Products → [Product Name]
  - Easy navigation back to product list
  - Clear visual hierarchy for location awareness

### Fixed
- Changelog page now accessible to all authenticated users
- Middleware route protection corrected to allow /changelog
- Version display consistency across portal

---

## [0.2.0] - 2026-06-22

### Added
- **Phase 4.1**: Product pricing display in warehouse orders
  - Warehouse specialists can view costPrice and sellingPrice for all order items
  - Edit pricing interface with real-time validation
  
- **Phase 4.2**: Order pricing summary for service technicians
  - "Wycenione" (priced) badge appears when all order items have prices set
  - Display total order sum and per-item price breakdown
  - Visual indicators for orders awaiting pricing (⏳ Oczekuje na wycenę)
  
- **Phase 4.3**: Discount management and final pricing
  - Warehouse specialists can apply discounts per item (% or fixed amount)
  - Auto-calculation of finalPrice based on discount type
  - Service technicians see finalPrice with discount breakdown
  - Green highlighting for priced items, warning colors for discounts

- **Product Catalog**: Detailed product information view
  - Product detail page with full information display
  - SKU, name, machine type, serial number, location
  - Product description (rich text support)
  - Price comparison (cost vs selling price)
  - Stock level display
  - Product image gallery (JSON array support)
  - Accessible from product list with direct links
  - Image management interface for warehouse specialists and admins
  - Add multiple product images via URL
  - Preview and remove images functionality

- **Versioning & Changelog**: Version tracking and release notes
  - VERSION file tracking current release (0.2.0)
  - CHANGELOG.md with detailed release notes
  - Public `/changelog` page for all authenticated users
  - Version display in sidebar with changelog link

### Changed
- Enhanced order detail UI with color-coded badges (Wycenione = green)
- Improved warehouse order management interface with inline pricing
- Better visual hierarchy for pricing information in order summaries
- Product schema extended with images field for gallery support
- **Admin product editing**: Full-featured `/admin/products/[id]` page for comprehensive product management
- **Search & Filters**: 
  - Search products by name on warehouse products list
  - Filter products by stock status (in stock, out of stock)
  - Search orders by number or partner name
- **Enhanced pricing confirmation**: Professional card design with checkmark indicator for priced orders
- **Product details editing**: Warehouse specialists can now edit product descriptions, serial numbers, and location information

### Fixed
- Prisma query include/select conflicts resolved
- Type safety improvements for pricing data structures

---

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
