# Dziennik Zmian

Wszystkie istotne zmiany w ASD Partner Portal będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
projekt przestrzega [Wersjonowania Semantycznego](https://semver.org/spec/v2.0.0.html).

## [0.10.7] - 2026-07-01

### CRITICAL FIX
- **Margin calculation formula was completely wrong!**
  - Old (WRONG): Marża = (finalPrice - costPrice) / costPrice * 100%
  - New (CORRECT): Marża = (finalPrice - costPrice) / finalPrice * 100%
  
  **Example - was showing -100%, now shows 54.36%:**
  - Cost: 23 zł
  - Selling price: 56 zł  
  - Discount: 10% (-5.60 zł)
  - Final price: 50.40 zł
  - Profit: 27.40 zł
  - OLD CALC: 27.40/23 = 119% ❌ (but showed as -100% error)
  - NEW CALC: 27.40/50.40 = 54.36% ✅

---

## [0.10.6] - 2026-07-01

### Dodane
- **Order Actions in Order Detail Page**
  - Added OrderActionsClient component at bottom of order detail
  - Buttons: Zatwierdź (Approve), Zawieś (Suspend), Odrzuć (Reject)
  - Server actions for status changes with history logging
  - Rejection reason dropdown when rejecting order
  
- **Server Actions (lib/actions/warehouse-orders.ts)**
  - `approveOrder()` - sets status to PRZYJĘTE
  - `suspendOrder()` - sets status to ZAWIESZONE  
  - `rejectOrder()` - sets status to ODRZUCONE with reason
  - All actions log to ServiceOrderHistory

### Zmieniane
- Order detail page now has complete order lifecycle management
- Removed dependency on list-view dropdown for order actions

---

## [0.10.5] - 2026-07-01

### Naprawione
- **Margin validation bug with costPrice = 0**
  - Fixed: When product doesn't have cost price, validation showed -100% error
  - Now: Shows 999% (no limit) when cost price is missing
  - Only validates margin when cost price > 0
  
- **Number input "010" issue in discount field**
  - Added min="0", max="100" attributes
  - Fixed value handling: `value={data?.discountValue ?? ""}`
  - Allows clear typing without leading zeros

---

## [0.10.4] - 2026-07-01

### Naprawione
- **Critical: Prices not showing in OrderPricingClient**
  - Fixed fallback logic for unit prices
  - If item.unitPrice is NULL → fallback to product.sellingPrice
  - Allows pricing older orders that don't have unitPrice set
  - Fixes "Marża za niska" error when prices were 0.00 PLN

---

## [0.10.3] - 2026-07-01

### Naprawione
- **Role-based redirect after login**
  - Dodane middleware.ts do automatycznego redirectu po zalogowaniu
  - SERVICE_TECHNICIAN → /service-technician/dashboard
  - WAREHOUSE_SPECIALIST → /warehouse
  - ADMIN → /admin/dashboard
  - STAFF → /staff/dashboard
  - PARTNER/PARTNER_ADMIN → /partner/dashboard
  - Eliminuje pokazywanie landing page po zalogowaniu

---

## [0.10.2] - 2026-07-01

### Naprawione
- **Caching issue w warehouse orders**
  - Dodane `revalidate = 0` na order detail page
  - Eliminuje konieczność drugiego kliknięcia aby wczytały się świeże dane
  - Zawsze pokazuje aktualny widok OrderPricingClient

---

## [0.10.1] - 2026-06-30

### Naprawione
- **Bugfix: "Później" button visibility in OrderPricingClient**
  - Usunięte agresywne `window.location.reload()` które powodowały jump'y na stronie
  - Dodany proper state cleanup (`setFormData({})`) po zapisaniu ceny lub partial order
  - Items teraz prawidłowo wychodzą z trybu edycji
  - Guziki "Edytuj" i "Później" są zawsze dostępne w view mode

---

## [0.10.0] - 2026-06-30

### Dodane
- **Bulk Discount Assignment (/admin/bulk-discounts)**
  - Trzy kolumny: wybór partnerów, wybór produktów, ustawienia rabatu
  - Search po nazwie/skrócie partnera
  - Search po nazwie/SKU produktu
  - Input rabatu procentowego (0-100%)
  - Live podsumowanie liczby przypisań do utworzenia
  - Checkbox selekcja dla partnerów i produktów

- **Server Actions**
  - `applyBulkDiscount()` — przypisanie rabatów do wielu kombinacji
  - `getPartnerDiscounts()` — rabaty partnera
  - `getAllPartners()` — lista wszystkich partnerów
  - `getAllProducts()` — lista wszystkich produktów
  - `deleteDiscount()` — usunięcie pojedynczego rabatu

- **Navigation**
  - Link do /admin/bulk-discounts w panelu admina

---

## [0.9.0] - 2026-06-30

### Dodane
- **Admin Dashboard (/admin/dashboard)**
  - Overview statystyki: całkowite zamówienia, przychód, liczba partnerów
  - Zamówienia wg statusu — breakdown po każdym statusie
  - Top 5 partnerów (wg przychodu) — nazwa, liczba zamówień, wartość
  - Ostatnie 10 zamówień — tabelka z kodem, partnerem, statusem, wartością, datą
  - Formatowanie walut (PLN) dla wyświetlania przychodów
  
- **Server Action: getAdminDashboardStats()**
  - Agregacja danych z ServiceOrder, Partner, ServiceOrderItem
  - Obliczanie przychodów z finalPrice * quantity
  - Grupowanie po partnerze i statusie
  
- **Navigation Update**
  - Link do /admin/dashboard w NAV_ADMIN dla roli ADMIN

---

## [0.8.0] - 2026-06-30

### Dodane
- **Cron Job dla Pending Order Reminders**
  - `/api/cron/pending-reminders` endpoint z token-based auth (CRON_SECRET_TOKEN)
  - Sprawdza PendingOrderItem z expectedDate w ciągu 5 dni
  - Oznacza reminderSentAt i loguje do ServiceOrderHistory
  - Grupuje remindery po zamówieniu aby uniknąć duplikatów
  - Wysyła notyfikacje (loguje info o partnerze i techniku)

- **Server Action: getPendingOrdersNeedingReminder()**
  - Zwraca listę pending items czekających na reminder
  - Dla dashboardów i monitorowania statusu

- **Dependencies**
  - date-fns dla date utilities (startOfDay, endOfDay, addDays)

---

## [0.7.0] - 2026-06-30

### Dodane
- **Order Templates (Szablony Zamówień)**
  - `/partner/templates` — zarządzanie szablonami zamówień
  - Tworzenie szablonów z listą produktów i ilościami
  - Edycja i usuwanie szablonów
  - Lista szablonów z podglądem zawartości
  - Integration z service technician quick order flow
  
- **Prisma Models**
  - OrderTemplate model — przechowywanie szablonów per partner
  - OrderTemplateItem model — produkty w szablonach

- **Server Actions (lib/actions/order-templates.ts)**
  - `createOrderTemplate()` — tworzenie nowego szablonu
  - `getPartnerTemplates()` — lista szablonów partnera
  - `getOrderTemplate()` — szczegóły szablonu
  - `updateOrderTemplate()` — edycja szablonu
  - `deleteOrderTemplate()` — usuwanie szablonu
  - `createOrderFromTemplate()` — tworzenie zamówienia z szablonu

### Zmienione
- Prisma client regenerated dla nowych modelów

---

## [0.6.3] - 2026-06-25

### Dodane
- **Search po SKU w Produktach**
  - Wyszukiwanie po nazwie LUB SKU w `/warehouse/products`
  - Case-insensitive search dla obu pól
  - SKU field dodany do Product interface

- **Service Technician Dedicated View**
  - `/service-technician/dashboard` — lista moich zamówień
  - Kolorowe STATUS BADGES dla każdego zamówienia:
    - 🔵 NOWE — oczekuje potwierdzenia
    - 🟢 PRZYJĘTE — potwierdzone
    - 🟡 CZĘŚCIOWO_ZREALIZOWANE
    - 🟣 WYCENIONE — pricing done
    - ⚫ ZREALIZOWANE — completed
    - 🔴 ODRZUCONE — rejected
  - Quick stats: total, pending confirmation, accepted, completed
  - Status indicators z komunikatami (czeka wycena, itd)

  - `/service-technician/products` — produkty do zamówienia
  - Bez cen, bez stanów (tylko dostępność: "Na stanie" / "Niedostępny")
  - Quick "Zamów" button dla każdego produktu
  - Grid layout z image/name/SKU
  - Auto-redirect do dashboard po utworzeniu zamówienia
  - Search po nazwie/SKU

- **Updated Navigation for SERVICE_TECHNICIAN**
  - Dashboard link (moje zamówienia)
  - Produkty link (zamów części)
  - Profil link

### Zmienione
- PortalShell: NAV_SERVICE_TECHNICIAN points to new `/service-technician/*` routes
- ProductsClient: added SKU field to interface and filtering

---

## [0.6.2] - 2026-06-24

### Dodane
- **Stan Magazynu w Zamówieniach (Warehouse Stock Display)**
  - 📦 Kolumna w każdym item'u pokazująca dostępny stan
  - Kolor wskaźnika: zielony (wystarczająco), pomarańczowy (niewystarczająco)
  - Widoczne zarówno w view jak i edit mode
  - Fetchowanie Inventory.currentStock z bazy

- **"Realizuj Później" — Partial Order UI**
  - ⏳ Button przy każdym item'u do zaznaczenia dostawy w późniejszym terminie
  - Modal do wyboru:
    - Przewidywana data dostępności (date picker)
    - Sufiks zamówienia (/A, /B, /C, /D, /E)
  - Zapisywanie do PendingOrderItem
  - Server actions dla partial order management:
    - `createPendingOrderItem()` — tworzenie
    - `getPendingOrderItems()` — pobieranie
    - `updatePendingOrderStatus()` — zmiana statusu
    - `getPendingOrdersNeedingReminder()` — do cron'a

- **Zapamiętywanie Rabatu per Partner**
  - localStorage: `partner_discount_{partnerId}`
  - Przy edycji item'u — auto-ładuje ostatni rabat partnera
  - Domyślnie PERCENT (%)
  - Zapisywanie po każdym sukcesie
  - Przechowywanie: typ (PERCENT/AMOUNT), wartość, timestamp

### Naprawione
- Brakujący inventory field w OrderPricingClient items mapping
  - Inventory.currentStock nie był przesyłany do komponentu
  - Dodano pole inventory w product mapping w warehouse/orders/[id]/page.tsx

### Zmienione
- OrderPricingClient: dodane state dla pending orders modal
- warehouse/orders/[id]/page.tsx: fetchuje Inventory z Products
- Product interface: opcjonalny inventory field
- Discount fields: auto-populate z localStorage

---

## [0.6.1] - 2026-06-24

### Dodane
- **Bulk Inventory Management System**
  - "Uzupełnij magazyn" button → modal z koszykiem produktów
  - Search & add multiple products na raz do jednej operacji
  - +/- buttons do szybkiej regulacji ilości
  - WZ/numer dokumentu dla całej operacji
  - Preview zmian przed zapisaniem
  - One-click "Zapisz wszystko" → tworzy audity dla wszystkich
  - Automatyczne przeładowanie po zapisie

- **Warehouse Stock Column in Products List**
  - "📦 Magazyn" kolumna w `/warehouse/products`
  - Porównanie: stan w systemie vs. fizycznie w magazynie
  - Kolorowe wskaźniki: zielony (OK), pomarańczowy (niezgodność)

- **Product Card Redesign (UX/UI)**
  - Eliminacja duplikatów pól i powtórzeń
  - Nowa struktura: Header (SKU, Nazwa, Typ, Dostępne) → Details (2-column)
  - Lewa kolumna: Zdjęcia
  - Prawa kolumna: Ceny, Stan magazynu (fizycznie + różnica), Szczegóły
  - Logiczny flow: View → Edit → Manage Images
  - Jeden "wróć" link zamiast duplikatów

### Zmienione
- Warehouse products page: fetchuje Inventory.currentStock
- Product detail page: reorganizacja sekcji dla lepszej czytelności
- Inventory list: dodane summary stats (produkty, razem na stanie)

---

## [0.6.0] - 2026-06-23

### Dodane
- **Partial Order Management System**
  - PendingOrderItem model for tracking split/delayed orders
  - Sub-order naming convention ("/A", "/B", etc)
  - Expected availability date tracking (weekly granularity)
  - Status workflow: PENDING → FULFILLED
  - Automatic reminder system (5 days before expected date)
  - Full order history with pending items

- **Server Actions for Partial Orders**
  - `createPendingOrderItem()` — create pending order for delayed item
  - `getPendingOrderItems()` — list all pending for order
  - `updatePendingOrderStatus()` — mark item as fulfilled
  - `getPendingOrdersNeedingReminder()` — fetch for cron scheduler
  - `markReminderSent()` — track reminder notifications

### Zmienione
- ServiceOrder now tracks pending items separately
- ServiceOrderItem linked to pending orders if partial
- Improved order fulfillment workflow for stock unavailability

### Uwaga
- UI component for "Realizuj Później" button planned for refactor phase
- Cron scheduler for reminders requires deployment configuration

---

 - 2026-06-23

### Dodane
- **Inventory Management System**
  - Inventory model per product (global stock tracking)
  - InventoryAudit model for complete change history
  - `/warehouse/inventory` page — warehouse stock management
  - Edit stock: current state → target state
  - Full audit trail with timestamps and user tracking
  - Notes field for WZ numbers and tracking info
  - Search products by name or SKU
  - Stock comparison: current inventory vs system stock
  - Auto-summary display on save with change details

- **Server Actions**
  - `updateInventoryStock()` — change stock with audit trail
  - `getInventoryHistory()` — fetch detailed audit history
  - `getAllInventory()` — list all inventory with history

### Zmienione
- Warehouse navigation now includes "Stan magazynu" link
- Inventory tracking integrated into product management
- Stock history permanently stored for audit purposes

---

## [0.4.0] - 2026-06-23

### Dodane
- **Multi-Currency Pricing System**
  - Partner.currency field (PLN, EUR, USD)
  - Partner.minProfitMargin field (configurable per partner, default 10%)
  - CurrencyExchangeRate table for tracking historical exchange rates
  - SystemConfig table for global admin parameters

- **Exchange Rates Management (Admin)**
  - `/admin/exchange-rates` page
  - Add/view currency exchange rates (PLN↔EUR, PLN↔USD, EUR↔USD)
  - Historical tracking of exchange rate changes
  - Global and partner-specific rates support

- **Warehouse Order Pricing Enhancement**
  - OrderPricingClient component for editable item pricing
  - Multi-currency support in order pricing form
  - Exchange rate input (auto-populated from admin settings)
  - Discount type selector (% or zł)
  - Margin validation: block sale if margin < configured minimum
  - Warning for partners with no orders in 12+ months
  - Notes field for WZ number and other tracking info
  - Live final price calculation with margin validation feedback

- **Server Actions for Pricing**
  - `updateOrderItemPricing()` — update item pricing with validation
  - `getExchangeRates()` — fetch applicable exchange rates
  - `addExchangeRate()` — admin action to add new rates
  - `getSystemConfig()` / `updateSystemConfig()` — admin config management
  - `checkPartnerOrderStatus()` — detect partners with no recent orders

### Zmienione
- Warehouse order detail page refactored to use pricing client
- Pricing validation now checks minimum margin dynamically
- Exchange rate history preserved for audit trail
- Order items now store currency and exchange rate at time of pricing

---

## [0.3.2] - 2026-06-23

### Dodane
- **Partner User Management — Zarządzanie serwisantami**
  - Page `/partner/users` — Partner może tworzyć konta serwisantów
  - Form do dodania nowego serwisanta (imię, email, hasło)
  - Auto-assign serwisanta do partnera (rola SERVICE_TECHNICIAN)
  - Lista wszystkich serwisantów przypisanych do partnera
  - Serwisanci mogą zamawiać części pod partnera
  - Opcja dodania wielu serwisantów na konto partnera

### Zmienione
- Added "Serwisanci" menu item w navigacji Partnera
- Partner navigation now includes user management

---

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
