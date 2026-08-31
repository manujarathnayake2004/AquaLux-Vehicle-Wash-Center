# AquaLux Theme and Staff Booking Fix — 27 Aug 2026

## Fixed issues

1. Staff booking demo data was cleaned so the queue no longer contains duplicated demo appointments. The clean sample week uses 12 customer/vehicle profiles, 31 unique booking slots and 19 matching payment records.
2. A safe duplicate-cleanup migration was added to `management.py` for legacy exact duplicate bookings.
3. Dark-mode form labels and text were corrected across Admin, Staff and Customer workspace pages. This includes booking labels, select values, date/time fields, table text, cards, profile areas and supporting notes.
4. A global dark/light theme controller was added to every HTML page. The selected theme is stored using the same `aqualuxTheme` preference and follows the user across pages.
5. Theme buttons are now available on all 45 HTML pages, including Admin, Staff, Customer, Home, Login, Register, AI pages and 403/404 pages.
6. Login/registration and standalone AI/public screens now support both dark and light appearance states.

## Validation

- 45 HTML pages include the global theme controller exactly once.
- 0 missing local CSS/JS/image references.
- All JavaScript files pass `node --check`.
- All Python files compile successfully.
- SQLite `PRAGMA integrity_check` returns `ok`.
- 31 bookings, 12 distinct booking customers, 0 exact duplicate booking groups and 0 duplicate booking slots in the supplied database.
- Theme-toggle runtime simulation passed on all 45 HTML pages with no theme-script errors.
