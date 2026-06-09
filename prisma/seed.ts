import "dotenv/config";
import { PrismaClient, Role, PartnerLevel, ProjectStatus, Procurement } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const db = new PrismaClient({ adapter });

// ─── Default content items ────────────────────────────────────────────────────
const DEFAULT_CONTENT: Array<{ key: string; value: string; label: string; group: string }> = [
  // Portal — ogólne
  { key: "portal.tagline", value: "Zgłaszaj projekty i zabezpiecz swoją relację z klientem", label: "Tagline portalu", group: "Portal" },
  { key: "portal.description", value: "Rejestr Projektów Partnerskich ASD Systems – zarządzaj projektami wdrożeń automatów wydających i chroń swoje relacje z klientami.", label: "Opis portalu", group: "Portal" },
  { key: "portal.protection.description", value: "Rejestrujesz klienta końcowego po NIP / Tax ID, a ASD Systems gwarantuje, że jeśli ten klient zgłosi się bezpośrednio do nas – przekierujemy go do Ciebie.", label: "Opis ochrony projektu", group: "Portal" },

  // Formularz nowego projektu
  { key: "form.customer.placeholder", value: "np. ABB Sp. z o.o., Volkswagen Poznań, IKEA Distribution", label: "Placeholder: nazwa klienta", group: "Formularz zgłoszenia" },
  { key: "form.description.placeholder", value: "Czego potrzebuje klient – rodzaj artykułów (BHP/MRO/narzędzia), liczba punktów wydawania, lokalizacja zakładów, wymagania dot. kontroli dostępu…", label: "Placeholder: opis potrzeby", group: "Formularz zgłoszenia" },
  { key: "form.notes.placeholder", value: "Dodatkowe informacje dla Handlowca ASD – np. decydent, etap rozmów, warunki przetargu…", label: "Placeholder: uwagi Partnera", group: "Formularz zgłoszenia" },
  { key: "form.branch.placeholder", value: "np. Zakład produkcyjny nr 2, Hala montażowa, Magazyn centralny", label: "Placeholder: oddział/lokalizacja", group: "Formularz zgłoszenia" },

  // Zakres wsparcia
  { key: "support.items", value: "Przygotowanie oferty,Udział w spotkaniu z klientem,Wsparcie techniczne,Wsparcie produktowe,Dobór modelu automatu,Analiza oszczędności,Materiały marketingowe,Prezentacja dla klienta,Indywidualne warunki handlowe", label: "Lista opcji wsparcia (przecinkami)", group: "Formularz zgłoszenia" },

  // E-mail powiadomienia
  { key: "email.from_name", value: "ASD Systems – Partner Portal", label: "Nazwa nadawcy e-maili", group: "E-mail" },
  { key: "email.footer", value: "ASD Systems Sp. z o.o. | asdsystems.eu | Partner Portal", label: "Stopka e-maili", group: "E-mail" },

  // Landing page — Hero
  { key: "landing.hero.title", value: "Zgłaszaj projekty vendingowe i buduj długoterminową przewagę u swoich klientów", label: "Tytuł hero", group: "Landing page" },
  { key: "landing.hero.subtitle", value: "Aplikacja partnerska ASD Systems pomaga operatorom i dystrybutorom zgłaszać projekty, chronić szanse sprzedażowe, korzystać ze wsparcia ASD oraz skuteczniej rozwijać vending u klientów końcowych.", label: "Podtytuł hero", group: "Landing page" },
  { key: "landing.hero.description", value: "Vending to nie tylko automat. To sposób na wydłużenie relacji z klientem, zwiększenie jego lojalności i wejście głębiej w proces zarządzania ŚOI oraz MRO. Dzięki aplikacji partnerskiej każdy projekt może być prowadzony przejrzyście — od pierwszego zgłoszenia, przez kwalifikację, aż po wdrożenie.", label: "Opis hero", group: "Landing page" },
  { key: "landing.hero.cta1", value: "Zgłoś projekt", label: "Przycisk CTA 1", group: "Landing page" },
  { key: "landing.hero.cta2", value: "Sprawdź status swoich projektów", label: "Przycisk CTA 2", group: "Landing page" },

  // Landing page — Problem
  { key: "landing.problem.title", value: "Sprzedaż vendingu wymaga czegoś więcej niż wysłania oferty", label: "Problem: Tytuł", group: "Landing page" },
  { key: "landing.problem.description", value: "Operatorzy coraz częściej widzą, że klienci końcowi oczekują nie tylko dostawy produktów, ale także kontroli zużycia, dostępności 24/7, raportowania oraz realnych oszczędności. Jednocześnie sprzedaż vendingu jest bardziej złożona niż standardowa sprzedaż ŚOI czy MRO.", label: "Problem: Opis", group: "Landing page" },
  { key: "landing.problem.questions", value: "jak zabezpieczyć projekt przed utratą szansy?,kiedy i w jaki sposób zaangażować ASD Systems?,jak policzyć opłacalność automatu?,jak pokazać klientowi końcowemu wartość a nie tylko cenę urządzenia?,jak uniknąć chaosu w komunikacji między operatorem klientem i ASD?", label: "Problem: Pytania (przecinkami)", group: "Landing page" },

  // Landing page — Wartości dla partnera
  { key: "landing.values.title", value: "Dlaczego warto zgłaszać projekty przez aplikację?", label: "Wartości: Tytuł", group: "Landing page" },
  { key: "landing.values.v1_title", value: "Ochrona szansy sprzedażowej", label: "Wartość 1: Tytuł", group: "Landing page" },
  { key: "landing.values.v1_desc", value: "Zgłoszenie projektu pozwala uporządkować informacje o kliencie, etapie rozmów i potencjale wdrożenia. Dzięki temu partner może jasno wskazać, nad jaką szansą pracuje i uzyskać większą przejrzystość współpracy z ASD Systems.", label: "Wartość 1: Opis", group: "Landing page" },
  { key: "landing.values.v2_title", value: "Szybsze wsparcie ASD", label: "Wartość 2: Tytuł", group: "Landing page" },
  { key: "landing.values.v2_desc", value: "Im lepiej opisany projekt, tym łatwiej dobrać odpowiedni automat, argumentację, materiały, case study lub wsparcie techniczne. Aplikacja pozwala ASD szybciej zrozumieć kontekst klienta końcowego.", label: "Wartość 2: Opis", group: "Landing page" },
  { key: "landing.values.v3_title", value: "Lepsza kwalifikacja projektów", label: "Wartość 3: Tytuł", group: "Landing page" },
  { key: "landing.values.v3_desc", value: "Nie każdy lead jest gotowy na vending. Dzięki ustrukturyzowanemu zgłoszeniu łatwiej ocenić potencjał projektu: branżę, liczbę pracowników, tryb pracy, zużycie produktów, obecny proces wydawania i możliwe źródła oszczędności.", label: "Wartość 3: Opis", group: "Landing page" },
  { key: "landing.values.v4_title", value: "Większa szansa na domknięcie sprzedaży", label: "Wartość 4: Tytuł", group: "Landing page" },
  { key: "landing.values.v4_desc", value: "Dobrze opisany projekt umożliwia przygotowanie mocniejszej argumentacji sprzedażowej: ROI, kontroli kosztów, dostępności 24/7, redukcji nadużyć oraz wartości dla różnych decydentów po stronie klienta końcowego.", label: "Wartość 4: Opis", group: "Landing page" },
  { key: "landing.values.v5_title", value: "Podstawa do dodatkowych benefitów partnerskich", label: "Wartość 5: Tytuł", group: "Landing page" },
  { key: "landing.values.v5_desc", value: "Aktywność projektowa może być podstawą do lepszych warunków współpracy, wsparcia marketingowego, priorytetowej obsługi, certyfikacji lub udziału w programie partnerskim ASD Systems.", label: "Wartość 5: Opis", group: "Landing page" },

  // Landing page — Funkcje aplikacji
  { key: "landing.features.title", value: "Wszystkie projekty vendingowe w jednym miejscu", label: "Funkcje: Tytuł", group: "Landing page" },
  { key: "landing.features.intro", value: "Aplikacja partnerska została zaprojektowana tak, aby partner mógł łatwo zarządzać projektami vendingowymi i mieć jasny obraz współpracy z ASD Systems.", label: "Funkcje: Intro", group: "Landing page" },
  { key: "landing.features.f1_title", value: "Zgłaszanie nowych projektów", label: "Funkcja 1: Tytuł", group: "Landing page" },
  { key: "landing.features.f1_desc", value: "Partner może dodać nowy projekt, opisać klienta końcowego, wskazać etap rozmów, potencjał wdrożenia oraz oczekiwane wsparcie ze strony ASD.", label: "Funkcja 1: Opis", group: "Landing page" },
  { key: "landing.features.f2_title", value: "Monitorowanie statusu", label: "Funkcja 2: Tytuł", group: "Landing page" },
  { key: "landing.features.f2_desc", value: "Każdy projekt może mieć aktualny status, dzięki czemu partner wie, czy temat jest w analizie, wymaga uzupełnienia, jest po stronie ASD, czy przeszedł do etapu ofertowania.", label: "Funkcja 2: Opis", group: "Landing page" },
  { key: "landing.features.f3_title", value: "Historia komunikacji", label: "Funkcja 3: Tytuł", group: "Landing page" },
  { key: "landing.features.f3_desc", value: "Partner może widzieć najważniejsze informacje związane z projektem, ustalenia i kolejne kroki, co zmniejsza ryzyko chaosu komunikacyjnego.", label: "Funkcja 3: Opis", group: "Landing page" },
  { key: "landing.features.f4_title", value: "Materiały sprzedażowe", label: "Funkcja 4: Tytuł", group: "Landing page" },
  { key: "landing.features.f4_desc", value: "W aplikacji mogą znaleźć się materiały wspierające rozmowę z klientem końcowym: prezentacje, argumenty ROI, case studies, checklisty discovery, porównania rozwiązań i odpowiedzi na obiekcje.", label: "Funkcja 4: Opis", group: "Landing page" },
  { key: "landing.features.f5_title", value: "Wsparcie ASD", label: "Funkcja 5: Tytuł", group: "Landing page" },
  { key: "landing.features.f5_desc", value: "Partner może wskazać, jakiego wsparcia potrzebuje: konsultacji technicznej, pomocy w doborze automatu, wsparcia w rozmowie z klientem, materiałów ofertowych lub kalkulacji opłacalności.", label: "Funkcja 5: Opis", group: "Landing page" },

  // Landing page — Proces
  { key: "landing.process.title", value: "Prosty proces od zgłoszenia do wdrożenia", label: "Proces: Tytuł", group: "Landing page" },
  { key: "landing.process.step1_title", value: "Zgłaszasz projekt", label: "Krok 1: Tytuł", group: "Landing page" },
  { key: "landing.process.step1_desc", value: "Dodajesz podstawowe informacje o kliencie końcowym, etapie rozmów i potencjale vendingowym.", label: "Krok 1: Opis", group: "Landing page" },
  { key: "landing.process.step2_title", value: "ASD analizuje zgłoszenie", label: "Krok 2: Tytuł", group: "Landing page" },
  { key: "landing.process.step2_desc", value: "Zespół ASD weryfikuje dane, ocenia potrzeby, dobiera możliwe rozwiązanie i wskazuje, jak najlepiej poprowadzić temat dalej.", label: "Krok 2: Opis", group: "Landing page" },
  { key: "landing.process.step3_title", value: "Uzupełniamy argumentację", label: "Krok 3: Tytuł", group: "Landing page" },
  { key: "landing.process.step3_desc", value: "Wspólnie określamy wartość dla klienta końcowego: oszczędności, kontrolę, dostępność 24/7, bezpieczeństwo, dane i ograniczenie ryzyka przestojów.", label: "Krok 3: Opis", group: "Landing page" },
  { key: "landing.process.step4_title", value: "Przygotowujemy ofertę lub wsparcie sprzedażowe", label: "Krok 4: Tytuł", group: "Landing page" },
  { key: "landing.process.step4_desc", value: "Na podstawie danych można przygotować rekomendację automatu, model wdrożenia, argumenty sprzedażowe, kalkulację ROI lub materiały dla klienta.", label: "Krok 4: Opis", group: "Landing page" },
  { key: "landing.process.step5_title", value: "Partner prowadzi projekt z większą skutecznością", label: "Krok 5: Tytuł", group: "Landing page" },
  { key: "landing.process.step5_desc", value: "Partner otrzymuje uporządkowany proces, lepsze argumenty i większą szansę na zamknięcie sprzedaży.", label: "Krok 5: Opis", group: "Landing page" },

  // Landing page — Jakie projekty warto
  { key: "landing.projects.title", value: "Kiedy projekt ma największy potencjał vendingowy?", label: "Projekty: Tytuł", group: "Landing page" },
  { key: "landing.projects.description", value: "Największy potencjał mają projekty, w których klient końcowy mierzy się z niekontrolowanym zużyciem produktów, pracą zmianową, brakiem danych, problemami z dostępnością lub potrzebą uporządkowania gospodarki magazynowej.", label: "Projekty: Opis", group: "Landing page" },
  { key: "landing.projects.signals", value: "pracuje w systemie zmianowym,ma wielu pracowników korzystających ze ŚOI lub MRO,notuje rosnące koszty zużycia,nie wie kto i ile produktów pobiera,ma problem z dostępnością produktów poza godzinami pracy magazynu,chce ograniczyć ręczne wydawanie produktów,potrzebuje raportowania per dział centrum kosztów lub pracownik,chce zmniejszyć stany magazynowe,ma częste zamówienia awaryjne,chce ograniczyć ryzyko przestojów,szuka sposobu na lepszą kontrolę dostawcy i rotacji produktów", label: "Projekty: Sygnały sprzedażowe (przecinkami)", group: "Landing page" },
  { key: "landing.projects.note", value: "Nie musisz mieć gotowej decyzji klienta. Wystarczy, że widzisz potencjał — aplikacja pomoże uporządkować projekt i określić kolejne kroki.", label: "Projekty: Notatka", group: "Landing page" },

  // Landing page — Wartość dla klienta
  { key: "landing.client.title", value: "Pomóż klientowi zobaczyć koszt którego dziś nie widzi", label: "Klient końcowy: Tytuł", group: "Landing page" },
  { key: "landing.client.intro", value: "Klient końcowy często patrzy na vending przez pryzmat ceny automatu. Rolą partnera jest pokazać mu szerszy obraz: ile kosztuje obecny sposób wydawania produktów, brak kontroli, nadmierne pobrania, czas magazyniera, awaryjne zamówienia i ryzyko braku dostępności.", label: "Klient końcowy: Intro", group: "Landing page" },
  { key: "landing.client.v1_title", value: "Kontrola zużycia", label: "Klient - Wartość 1: Tytuł", group: "Landing page" },
  { key: "landing.client.v1_desc", value: "Klient wie, kto pobrał produkt, kiedy, w jakiej ilości i z jakiego obszaru organizacji.", label: "Klient - Wartość 1: Opis", group: "Landing page" },
  { key: "landing.client.v2_title", value: "Redukcja kosztów", label: "Klient - Wartość 2: Tytuł", group: "Landing page" },
  { key: "landing.client.v2_desc", value: "Automatyzacja i limity pobrań pomagają ograniczyć nadmierne zużycie. W wielu projektach spadek zużycia może wynosić minimum około 20%, a w wybranych przypadkach nawet więcej.", label: "Klient - Wartość 2: Opis", group: "Landing page" },
  { key: "landing.client.v3_title", value: "Dostępność 24/7", label: "Klient - Wartość 3: Tytuł", group: "Landing page" },
  { key: "landing.client.v3_desc", value: "Pracownicy mogą pobierać potrzebne produkty również poza standardowymi godzinami pracy magazynu.", label: "Klient - Wartość 3: Opis", group: "Landing page" },
  { key: "landing.client.v4_title", value: "Mniej pracy ręcznej", label: "Klient - Wartość 4: Tytuł", group: "Landing page" },
  { key: "landing.client.v4_desc", value: "Magazynier nie musi zajmować się powtarzalnym wydawaniem podstawowych produktów i może skupić się na zadaniach o większej wartości.", label: "Klient - Wartość 4: Opis", group: "Landing page" },
  { key: "landing.client.v5_title", value: "Dane do decyzji", label: "Klient - Wartość 5: Tytuł", group: "Landing page" },
  { key: "landing.client.v5_desc", value: "Raporty pozwalają analizować zużycie według produktów, działów, pracowników lub centrów kosztów.", label: "Klient - Wartość 5: Opis", group: "Landing page" },
  { key: "landing.client.v6_title", value: "Mniejsze ryzyko przestojów", label: "Klient - Wartość 6: Tytuł", group: "Landing page" },
  { key: "landing.client.v6_desc", value: "Produkty krytyczne mogą być dostępne tam, gdzie są potrzebne, wtedy, gdy są potrzebne.", label: "Klient - Wartość 6: Opis", group: "Landing page" },

  // Landing page — Wartość dla operatora
  { key: "landing.operator.title", value: "Vending to kotwica długoterminowej relacji z klientem", label: "Operator: Tytuł", group: "Landing page" },
  { key: "landing.operator.intro", value: "Dla operatora vending nie powinien być traktowany wyłącznie jako sprzedaż urządzenia. To sposób na wejście głębiej w proces klienta końcowego i zbudowanie relacji trudniejszej do przejęcia przez konkurencję.", label: "Operator: Intro", group: "Landing page" },
  { key: "landing.operator.v1_title", value: "Wydłużenie LTV klienta", label: "Operator - Wartość 1: Tytuł", group: "Landing page" },
  { key: "landing.operator.v1_desc", value: "Automat może związać klienta z operatorem na lata, ponieważ operator staje się częścią codziennego procesu wydawania produktów.", label: "Operator - Wartość 1: Opis", group: "Landing page" },
  { key: "landing.operator.v2_title", value: "Trudniejsza zmiana dostawcy", label: "Operator - Wartość 2: Tytuł", group: "Landing page" },
  { key: "landing.operator.v2_desc", value: "Klient korzystający z automatu, raportów, limitów i ustrukturyzowanego procesu rzadziej zmienia dostawcę wyłącznie z powodu ceny produktu.", label: "Operator - Wartość 2: Opis", group: "Landing page" },
  { key: "landing.operator.v3_title", value: "Dane do cross-sellu", label: "Operator - Wartość 3: Tytuł", group: "Landing page" },
  { key: "landing.operator.v3_desc", value: "Operator widzi realne zużycie i może proponować klientowi dodatkowe produkty, zamienniki, optymalizacje lub nowe kategorie.", label: "Operator - Wartość 3: Opis", group: "Landing page" },
  { key: "landing.operator.v4_title", value: "Przewaga nad konkurencją", label: "Operator - Wartość 4: Tytuł", group: "Landing page" },
  { key: "landing.operator.v4_desc", value: "Dostawca oferujący vending wygląda bardziej profesjonalnie niż firma sprzedająca wyłącznie produkty z katalogu.", label: "Operator - Wartość 4: Opis", group: "Landing page" },
  { key: "landing.operator.v5_title", value: "Sprzedaż usługi nie tylko produktów", label: "Operator - Wartość 5: Tytuł", group: "Landing page" },
  { key: "landing.operator.v5_desc", value: "Operator może rozwijać model oparty na obsłudze, danych, uzupełnieniach, raportowaniu i długoterminowym partnerstwie.", label: "Operator - Wartość 5: Opis", group: "Landing page" },

  // Landing page — Dla kogo
  { key: "landing.for_whom.title", value: "Dla partnerów którzy chcą rozwijać vending w uporządkowany sposób", label: "Dla kogo: Tytuł", group: "Landing page" },
  { key: "landing.for_whom.intro", value: "Aplikacja jest przeznaczona dla operatorów, dystrybutorów i partnerów handlowych ASD Systems, którzy chcą aktywnie rozwijać projekty vendingowe u swoich klientów końcowych.", label: "Dla kogo: Intro", group: "Landing page" },
  { key: "landing.for_whom.users", value: "właściciele i zarządy firm dystrybucyjnych,dyrektorzy sprzedaży,handlowcy obsługujący klientów przemysłowych,osoby odpowiedzialne za rozwój vendingu,opiekunowie kluczowych klientów,osoby odpowiedzialne za ofertowanie i wdrożenia", label: "Dla kogo: Użytkownicy (przecinkami)", group: "Landing page" },

  // Landing page — Ochrona
  { key: "landing.trust.title", value: "Przejrzysta współpraca i jasne zasady pracy nad projektem", label: "Ochrona: Tytuł", group: "Landing page" },
  { key: "landing.trust.intro", value: "Jedną z najważniejszych wartości aplikacji jest uporządkowanie współpracy między partnerem a ASD Systems. Zgłoszenie projektu pozwala jasno określić, kto prowadzi temat, na jakim etapie znajduje się szansa oraz jakiego wsparcia wymaga partner.", label: "Ochrona: Intro", group: "Landing page" },
  { key: "landing.trust.points", value: "partner zachowuje kontrolę nad relacją z klientem,ASD wspiera projekt zgodnie z ustalonym zakresem,informacje o projekcie są uporządkowane w jednym miejscu,statusy pomagają uniknąć nieporozumień,historia projektu zwiększa transparentność współpracy,aktywność projektowa może wpływać na poziom partnerstwa i warunki handlowe", label: "Ochrona: Punkty (przecinkami)", group: "Landing page" },
  { key: "landing.trust.note", value: "Aplikacja nie zastępuje relacji handlowej partnera z klientem. Jej celem jest wzmocnienie partnera, uporządkowanie współpracy i zwiększenie skuteczności sprzedaży vendingu.", label: "Ochrona: Notatka", group: "Landing page" },

  // Landing page — Materiały
  { key: "landing.materials.title", value: "Nie zostajesz sam z rozmową o vendingu", label: "Materiały: Tytuł", group: "Landing page" },
  { key: "landing.materials.intro", value: "Sprzedaż vendingu wymaga pokazania klientowi wartości biznesowej, nie tylko technologii. Dlatego aplikacja może być miejscem, w którym partner otrzymuje dostęp do materiałów pomagających prowadzić rozmowy z klientami końcowymi.", label: "Materiały: Intro", group: "Landing page" },
  { key: "landing.materials.list", value: "prezentacje dla klienta końcowego,kalkulator ROI,argumentacja dla CFO zakupów BHP i produkcji,case studies,lista pytań discovery,skrypt rozmowy handlowej,odpowiedzi na obiekcje,porównanie bębnów i spiral,checklisty kwalifikacji projektu,materiały marketingowe do wspólnego wykorzystania,wzory wiadomości follow-up po spotkaniu", label: "Materiały: Lista (przecinkami)", group: "Landing page" },

  // Landing page — Statusy
  { key: "landing.statuses.title", value: "Wiesz na jakim etapie jest każdy projekt", label: "Statusy: Tytuł", group: "Landing page" },
  { key: "landing.statuses.new", value: "Projekt został zgłoszony przez partnera i oczekuje na weryfikację", label: "Status Nowy", group: "Landing page" },
  { key: "landing.statuses.needinfo", value: "Brakuje danych potrzebnych do oceny potencjału lub przygotowania rekomendacji", label: "Status Do uzupełnienia", group: "Landing page" },
  { key: "landing.statuses.verify", value: "Zespół ASD analizuje projekt, potrzeby klienta i możliwe rozwiązanie", label: "Status W analizie ASD", group: "Landing page" },
  { key: "landing.statuses.active", value: "Projekt wymaga materiałów, konsultacji, argumentacji lub udziału ASD w przygotowaniu rozmowy", label: "Status Wsparcie sprzedażowe", group: "Landing page" },
  { key: "landing.statuses.won", value: "Projekt zakończył się sukcesem", label: "Status Wygrany", group: "Landing page" },
  { key: "landing.statuses.lost", value: "Projekt nie został zrealizowany. Warto wskazać powód utraty aby lepiej analizować sprzedaż", label: "Status Utracony", group: "Landing page" },

  // Landing page — Dane do zgłoszenia
  { key: "landing.data.title", value: "Jakie informacje warto przygotować?", label: "Dane: Tytuł", group: "Landing page" },
  { key: "landing.data.intro", value: "Im lepiej opisany projekt, tym szybciej można określić jego potencjał i przygotować właściwe wsparcie.", label: "Dane: Intro", group: "Landing page" },
  { key: "landing.data.basic", value: "nazwa klienta końcowego,branża,lokalizacja,liczba pracowników,liczba zmian,osoba kontaktowa po stronie klienta,etap rozmowy,przewidywany termin decyzji", label: "Dane: Podstawowe (przecinkami)", group: "Landing page" },
  { key: "landing.data.process", value: "jak dziś wydawane są produkty,kto odpowiada za wydawanie,czy magazyn działa 24/7,jakie produkty są najczęściej pobierane,czy klient ma problem z nadmiernym zużyciem,czy występują awaryjne zamówienia,czy klient mierzy zużycie per dział pracownik lub MPK,czy występowały problemy z dostępnością produktów", label: "Dane: O procesie (przecinkami)", group: "Landing page" },
  { key: "landing.data.business", value: "szacowana miesięczna wartość zużycia ŚOI/MRO,potencjalny zakres produktów w automacie,oczekiwany model współpracy,obecny dostawca,główny powód zainteresowania vendingiem,najważniejsze obiekcje klienta", label: "Dane: Biznesowe (przecinkami)", group: "Landing page" },

  // Landing page — FAQ
  { key: "landing.faq.title", value: "Najczęstsze pytania partnerów", label: "FAQ: Tytuł", group: "Landing page" },
  { key: "landing.faq.q1", value: "Czy muszę mieć zgodę klienta żeby zgłosić projekt?", label: "FAQ Q1", group: "Landing page" },
  { key: "landing.faq.a1", value: "Nie. Projekt można zgłosić już na etapie rozpoznania potencjału. Ważne jest jednak aby jasno opisać na jakim etapie znajduje się rozmowa.", label: "FAQ A1", group: "Landing page" },
  { key: "landing.faq.q2", value: "Czy ASD przejmie mojego klienta?", label: "FAQ Q2", group: "Landing page" },
  { key: "landing.faq.a2", value: "Celem aplikacji jest wsparcie partnera w prowadzeniu projektu a nie zastąpienie go w relacji z klientem. Zakres udziału ASD powinien być jasno ustalony przy projekcie.", label: "FAQ A2", group: "Landing page" },
  { key: "landing.faq.q3", value: "Co zyskuję zgłaszając projekt?", label: "FAQ Q3", group: "Landing page" },
  { key: "landing.faq.a3", value: "Zyskujesz uporządkowany proces, większą przejrzystość współpracy, szybsze wsparcie ASD, możliwość lepszej kwalifikacji projektu oraz potencjalnie dostęp do benefitów programu partnerskiego.", label: "FAQ A3", group: "Landing page" },
  { key: "landing.faq.q4", value: "Czy aplikacja służy tylko do dużych projektów?", label: "FAQ Q4", group: "Landing page" },
  { key: "landing.faq.a4", value: "Nie. Warto zgłaszać każdy projekt który ma realny potencjał vendingowy — szczególnie wtedy gdy klient ma problem z kontrolą zużycia dostępnością produktów lub pracą zmianową.", label: "FAQ A4", group: "Landing page" },
  { key: "landing.faq.q5", value: "Czy zgłoszenie projektu gwarantuje rabat?", label: "FAQ Q5", group: "Landing page" },
  { key: "landing.faq.a5", value: "Nie samo zgłoszenie ale aktywność projektowa, jakość współpracy, poziom partnerstwa i realizacja ustalonych warunków mogą wpływać na dostępne warunki handlowe.", label: "FAQ A5", group: "Landing page" },
  { key: "landing.faq.q6", value: "Co jeśli projekt zostanie utracony?", label: "FAQ Q6", group: "Landing page" },
  { key: "landing.faq.a6", value: "Warto oznaczyć projekt jako utracony i wskazać powód. Dzięki temu partner i ASD mogą lepiej analizować bariery sprzedażowe oraz przygotować skuteczniejsze argumenty na przyszłość.", label: "FAQ A6", group: "Landing page" },

  // Landing page — CTA
  { key: "landing.cta.title", value: "Masz klienta z potencjałem na vending? Zgłoś projekt i sprawdź jak możemy pomóc.", label: "CTA: Tytuł", group: "Landing page" },
  { key: "landing.cta.description", value: "Nie czekaj aż temat przejdzie do konkurencji albo utknie na pytaniu o cenę. Zgłoszenie projektu pozwala szybciej ocenić potencjał, dobrać argumenty i przygotować partnera do skuteczniejszej rozmowy z klientem końcowym.", label: "CTA: Opis", group: "Landing page" },
  { key: "landing.cta.btn1", value: "Zgłoś nowy projekt", label: "CTA: Przycisk 1", group: "Landing page" },
  { key: "landing.cta.btn2", value: "Przejdź do panelu partnera", label: "CTA: Przycisk 2", group: "Landing page" },
  { key: "landing.cta.btn3", value: "Skontaktuj się z ASD w sprawie wsparcia projektu", label: "CTA: Przycisk 3", group: "Landing page" },

  // ASD Systems — Produkty
  { key: "asd.bhp.title", value: "Środki Bezpieczeństwa i Higieny Pracy", label: "Tytuł sekcji BHP", group: "ASD Systems — Oferta" },
  { key: "asd.bhp.description", value: "Automaty wydające do zarządzania rękawicami ochronnymi, goggles, nausznikami, maskami i innymi środkami BHP. Pełna kontrola pobrań per pracownik, raportowanie do systemu ZSZT.", label: "Opis BHP", group: "ASD Systems — Oferta" },

  { key: "asd.mro.title", value: "Części Zamienne i Materiały MRO", label: "Tytuł sekcji MRO", group: "ASD Systems — Oferta" },
  { key: "asd.mro.description", value: "Systemy automatyczne do wydawania części zamiennych, materiałów konserwacyjnych i usługowych. Zarządzanie stanem magazynu, śledzenie zużycia, integracja z systemami ERP.", label: "Opis MRO", group: "ASD Systems — Oferta" },

  { key: "asd.tools.title", value: "Narzędzia i Sprzęt", label: "Tytuł sekcji narzędzia", group: "ASD Systems — Oferta" },
  { key: "asd.tools.description", value: "Automaty do wydawania narzędzi precyzyjnych, sprzętu pomiarowego i testowego. Sprawdzenie dostępności, rezerwacja, śledzenie wypożyczeń, integracja z systemami logistyki.", label: "Opis narzędzi", group: "ASD Systems — Oferta" },

  // ASD Systems — Korzyści
  { key: "asd.benefits.control", value: "Pełna kontrola dostępu i pobrań — każdy pracownik identyfikowany przez kartę RFID, wszystkie operacje rejestrowane.", label: "Korzyść: Kontrola", group: "ASD Systems — Korzyści" },
  { key: "asd.benefits.efficiency", value: "Zwiększenie wydajności — brak kolejek, automatyczne wydawanie, redukcja czasu postoju maszyn.", label: "Korzyść: Wydajność", group: "ASD Systems — Korzyści" },
  { key: "asd.benefits.inventory", value: "Zarządzanie zapasami — monitoring stanu magazynu w czasie rzeczywistym, automatyczne powiadomienia o niedoborach.", label: "Korzyść: Magazyn", group: "ASD Systems — Korzyści" },
  { key: "asd.benefits.analytics", value: "Analityka i raporty — zużycie per działów, trendy, optymalizacja kosztów, wsparcie decyzji inwestycyjnych.", label: "Korzyść: Analityka", group: "ASD Systems — Korzyści" },

  // ASD Systems — Kluczowe info
  { key: "asd.machines.types", value: "D810neo,D820 Compact,D920,D920 XL,Medicamat 300,Medicamat 500", label: "Modele automatów", group: "ASD Systems — Maszyny" },
  { key: "asd.integration", value: "Integracja z systemami: SAP, Oracle, Microsoft Dynamics, systemami SZZT, platformami MES.", label: "Integracje", group: "ASD Systems — Maszyny" },
  { key: "asd.support", value: "Serwis: instalacja, konfiguracja, szkolenie operatorów, wsparcie techniczne 24/7, części zamienne.", label: "Wsparcie i serwis", group: "ASD Systems — Maszyny" },

  // Projektu — kraje
  { key: "project.countries", value: "Polska,Czechy,Słowacja,Niemcy,Austria,Litwa,Kanada", label: "Lista krajów (przecinkami)", group: "Projekt — opcje" },

  // Projektu — etapy
  { key: "project.stages", value: "Rozpoznanie potrzeb,Prezentacja / demo,Oferta,Negocjacje,Decyzja klienta", label: "Lista etapów (przecinkami)", group: "Projekt — opcje" },

  // Projektu — zakresy
  { key: "project.ranges", value: "1,2–3,4–6,8–10,10–15,16+,Nie wiem / do ustalenia", label: "Szacowana liczba automatów (przecinkami)", group: "Projekt — opcje" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Reps
  const rep1 = await db.rep.upsert({
    where: { email: "m.kowalczyk@asdsystems.pl" },
    update: {},
    create: {
      id: "rep-1",
      name: "Marta Kowalczyk",
      initials: "MK",
      email: "m.kowalczyk@asdsystems.pl",
      region: "Region Centralny",
      phone: "+48 500 000 001",
    },
  });

  await db.rep.upsert({
    where: { email: "t.zieba@asdsystems.pl" },
    update: {},
    create: {
      id: "rep-2",
      name: "Tomasz Zięba",
      initials: "TZ",
      email: "t.zieba@asdsystems.pl",
      region: "Region Południe",
      phone: "+48 500 000 002",
    },
  });

  // Partners
  const vendmax = await db.partner.upsert({
    where: { id: "p-vendmax" },
    update: {},
    create: {
      id: "p-vendmax",
      name: "Vendmax Sp. z o.o.",
      short: "Vendmax",
      city: "Łódź",
      country: "Polska",
      level: PartnerLevel.SILVER,
      discount: 8,
      candidate: false,
      contact: "Paweł Nowak",
      email: "p.nowak@vendmax.pl",
      phone: "+48 601 234 567",
      since: "2023-04",
      machinesReported: 24,
      repId: rep1.id,
      markets: { create: [{ name: "Polska" }, { name: "Czechy" }] },
    },
  });

  const automatpro = await db.partner.upsert({
    where: { id: "p-automatpro" },
    update: {},
    create: {
      id: "p-automatpro",
      name: "AutomatPro s.c.",
      short: "AutomatPro",
      city: "Katowice",
      country: "Polska",
      level: PartnerLevel.GOLD,
      discount: 12,
      candidate: false,
      contact: "Iwona Bąk",
      email: "biuro@automatpro.pl",
      phone: "+48 602 110 220",
      since: "2021-09",
      machinesReported: 41,
      repId: rep1.id,
      markets: { create: [{ name: "Polska" }, { name: "Słowacja" }] },
    },
  });

  const refresh = await db.partner.upsert({
    where: { id: "p-refresh" },
    update: {},
    create: {
      id: "p-refresh",
      name: "RefreshPoint Sp. z o.o.",
      short: "RefreshPoint",
      city: "Gdańsk",
      country: "Polska",
      level: PartnerLevel.BRONZE,
      discount: 5,
      candidate: true,
      contact: "Marek Lis",
      email: "kontakt@refreshpoint.pl",
      phone: "+48 603 998 100",
      since: "2025-11",
      machinesReported: 9,
      repId: rep1.id,
      markets: { create: [{ name: "Polska" }] },
    },
  });

  // Users
  const hash = await bcrypt.hash("demo1234", 10);
  const adminHash = await bcrypt.hash("TymczasoweHaslo", 10);

  await db.user.upsert({
    where: { email: "p.nowak@vendmax.pl" },
    update: {},
    create: { email: "p.nowak@vendmax.pl", password: hash, name: "Paweł Nowak", role: Role.PARTNER, partnerId: vendmax.id },
  });
  await db.user.upsert({
    where: { email: "m.kowalczyk@asdsystems.pl" },
    update: {},
    create: { email: "m.kowalczyk@asdsystems.pl", password: hash, name: "Marta Kowalczyk", role: Role.STAFF, repId: rep1.id },
  });
  await db.user.upsert({
    where: { email: "admin@asdsystems.pl" },
    update: {},
    create: { email: "admin@asdsystems.pl", password: hash, name: "Admin ASD", role: Role.ADMIN },
  });
  // Konto dla Pawła Salamona
  await db.user.upsert({
    where: { email: "p.salamon@asdsystems.pl" },
    update: { password: adminHash },
    create: { email: "p.salamon@asdsystems.pl", password: adminHash, name: "Paweł Salamon", role: Role.ADMIN },
  });

  // Projects — zaktualizowane opisy BHP/MRO
  const projects = [
    {
      id: "ASD-PRJ-2026-0052",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Volkswagen Poznań Sp. z o.o.",
      customerTaxId: "5871122003",
      customerCountry: "Polska",
      location: "Poznań",
      branch: "Hala produkcyjna A – montaż",
      machines: "8–10",
      procurement: Procurement.BIEZACA,
      stage: "Negocjacje",
      description:
        "Klient planuje wdrożenie 9 automatów D810neo do wydawania środków BHP (rękawice, okulary ochronne, nauszniki) oraz MRO w halach produkcyjnych. Wymagana pełna kontrola pobrań per pracownik i integracja z systemem kadrowym.",
      decisionDate: "2026-07",
      interested: true,
      wantsSupport: true,
      support: ["Dobór modelu automatu", "Analiza oszczędności", "Indywidualne warunki handlowe"],
      notes: "Decydent: kierownik BHP. Spotkanie demonstracyjne odbyte 14.05.",
      status: ProjectStatus.ACTIVE,
      protected: true,
      createdAt: new Date("2026-05-22"),
      acceptedAt: new Date("2026-05-28"),
      expiresAt: new Date("2026-08-28"),
    },
    {
      id: "ASD-PRJ-2026-0033",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "ABB Sp. z o.o.",
      customerTaxId: "8123344551",
      customerCountry: "Polska",
      location: "Kraków",
      branch: "Zakład Transformatorów",
      machines: "4–6",
      procurement: Procurement.BIEZACA,
      stage: "Oferta",
      description:
        "Zakład transformatorów – 5 automatów do wydawania narzędzi precyzyjnych i środków BHP. Klient oczekuje rozwiązania z czytnikiem kart RFID i pełnym raportem pobrań.",
      decisionDate: "2026-06",
      interested: true,
      wantsSupport: true,
      support: ["Przygotowanie oferty", "Prezentacja dla klienta"],
      notes: "",
      status: ProjectStatus.ACTIVE,
      protected: true,
      createdAt: new Date("2026-03-20"),
      acceptedAt: new Date("2026-03-25"),
      expiresAt: new Date("2026-06-25"),
    },
    {
      id: "ASD-PRJ-2026-0051",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "IKEA Industry Poland Sp. z o.o.",
      customerTaxId: "6751122334",
      customerCountry: "Polska",
      location: "Lubawa",
      branch: "Fabryka mebli – Wydział meblowy",
      machines: "16+",
      procurement: Procurement.ZAPYTANIE,
      stage: "Prezentacja / demo",
      description:
        "Duży zakład produkcyjny – automaty do wydawania środków BHP i narzędzi na wielu wydziałach. Klient zbiera oferty od kilku dostawców. Wymagana integracja z SAP.",
      decisionDate: "2026-09",
      interested: true,
      wantsSupport: true,
      support: ["Udział w spotkaniu z klientem", "Wsparcie techniczne", "Analiza oszczędności"],
      notes: "Wymagana integracja z SAP Plant Maintenance.",
      status: ProjectStatus.VERIFY,
      protected: false,
      createdAt: new Date("2026-06-01"),
      acceptedAt: null,
      expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0047",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Solaris Bus & Coach S.A.",
      customerTaxId: "7122339988",
      customerCountry: "Polska",
      location: "Bolechowo",
      branch: "Hala produkcyjna nr 3",
      machines: "2–3",
      procurement: Procurement.BIEZACA,
      stage: "Rozpoznanie potrzeb",
      description:
        "Producent autobusów – wstępne zapytanie o automaty do wydawania narzędzi warsztatowych na linii montażu.",
      decisionDate: "",
      interested: true,
      wantsSupport: false,
      support: [],
      notes: "",
      status: ProjectStatus.NEEDINFO,
      protected: false,
      createdAt: new Date("2026-05-30"),
      acceptedAt: null,
      expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0039",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Politechnika Poznańska",
      customerTaxId: "9462233445",
      customerCountry: "Polska",
      location: "Poznań",
      branch: "Wydział Mechaniczny",
      machines: "10–15",
      procurement: Procurement.PRZETARG,
      stage: "Oferta",
      description:
        "Uczelnia techniczna ogłosiła przetarg na automaty do wydawania materiałów i narzędzi do ćwiczeń laboratoryjnych na 5 wydziałach.",
      decisionDate: "2026-08",
      interested: true,
      wantsSupport: false,
      support: [],
      notes: "Przetarg publiczny – dokumentacja na platformie e-zamówienia.",
      status: ProjectStatus.NOPROT,
      protected: false,
      createdAt: new Date("2026-04-11"),
      acceptedAt: new Date("2026-04-15"),
      expiresAt: new Date("2026-07-15"),
    },
    {
      id: "ASD-PRJ-2026-0018",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Scania Production Słupsk Sp. z o.o.",
      customerTaxId: "5223344556",
      customerCountry: "Polska",
      location: "Słupsk",
      branch: "",
      machines: "4–6",
      procurement: Procurement.BIEZACA,
      stage: "Negocjacje",
      description:
        "Zakład produkcji silników – automaty do wydawania środków BHP i MRO dla pracowników zmianowych.",
      decisionDate: "",
      interested: true,
      wantsSupport: false,
      support: [],
      notes: "",
      status: ProjectStatus.EXPIRED,
      protected: false,
      createdAt: new Date("2026-02-15"),
      acceptedAt: new Date("2026-02-20"),
      expiresAt: new Date("2026-05-20"),
    },
    {
      id: "ASD-PRJ-2026-0009",
      partnerId: vendmax.id,
      repId: rep1.id,
      customerName: "Siemens Manufacturing Sp. z o.o.",
      customerTaxId: "5260011223",
      customerCountry: "Polska",
      location: "Wrocław",
      branch: "Zakład elektryczny – 12 hal",
      machines: "16+",
      procurement: Procurement.BIEZACA,
      stage: "Decyzja klienta",
      description:
        "Wdrożenie systemu automatów D1080neo do wydawania środków ochrony indywidualnej i narzędzi elektrycznych we wszystkich halach produkcyjnych.",
      decisionDate: "2026-03",
      interested: true,
      wantsSupport: true,
      support: ["Indywidualne warunki handlowe", "Materiały marketingowe"],
      notes: "Zamówienie 18 automatów. Kontrakt wieloletni.",
      status: ProjectStatus.WON,
      protected: false,
      createdAt: new Date("2026-01-10"),
      acceptedAt: new Date("2026-01-14"),
      expiresAt: new Date("2026-04-14"),
    },
    {
      id: "ASD-PRJ-2026-0055",
      partnerId: refresh.id,
      repId: rep1.id,
      customerName: "Volkswagen Poznań Sp. z o.o.",
      customerTaxId: "5871122003",
      customerCountry: "Polska",
      location: "Poznań",
      branch: "Hala lakierni",
      machines: "4–6",
      procurement: Procurement.BIEZACA,
      stage: "Rozpoznanie potrzeb",
      description:
        "Lakiernia – dodatkowe automaty do wydawania odzieży roboczej i środków lakierniczych BHP.",
      decisionDate: "",
      interested: true,
      wantsSupport: true,
      support: ["Przygotowanie oferty"],
      notes: "",
      status: ProjectStatus.DUP,
      protected: false,
      conflictsWith: "ASD-PRJ-2026-0052",
      createdAt: new Date("2026-06-02"),
      acceptedAt: null,
      expiresAt: null,
    },
    {
      id: "ASD-PRJ-2026-0054",
      partnerId: automatpro.id,
      repId: rep1.id,
      customerName: "PKN ORLEN S.A.",
      customerTaxId: "6342211990",
      customerCountry: "Polska",
      location: "Płock",
      branch: "Rafineria – Dział Utrzymania Ruchu",
      machines: "16+",
      procurement: Procurement.PRZETARG,
      stage: "Oferta",
      description:
        "Przetarg na dostawę automatów wydających do zarządzania częściami zamiennymi MRO i środkami BHP w rafinerii.",
      decisionDate: "2026-10",
      interested: true,
      wantsSupport: true,
      support: ["Wsparcie techniczne", "Analiza oszczędności"],
      notes: "",
      status: ProjectStatus.VERIFY,
      protected: false,
      createdAt: new Date("2026-06-01"),
      acceptedAt: null,
      expiresAt: null,
    },
  ];

  for (const p of projects) {
    await db.project.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...p,
        history: {
          create: [{ who: "System", text: "Zgłoszenie projektu (seed)" }],
        },
      },
    });
  }

  // Content items
  for (const item of DEFAULT_CONTENT) {
    await db.contentItem.upsert({
      where: { key: item.key },
      update: {},
      create: item,
    });
  }

  console.log("✅ Seed complete");
  console.log("   Partner:       p.nowak@vendmax.pl / demo1234");
  console.log("   Handlowiec:    m.kowalczyk@asdsystems.pl / demo1234");
  console.log("   Admin (demo):  admin@asdsystems.pl / demo1234");
  console.log("   Admin (Pawel): p.salamon@asdsystems.pl / TymczasoweHaslo");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
