# PRD

## Workflow (must do!!!!)

1. **Status:** Wichtig: `git diff` prüfen → bei Änderungen: genau prüfen, passende Tests (`npm test`) und commiten/pushen
2. **Feature:** EIN Feature aus "Offen" wählen (höchste Priorität zuerst - bewerte selbst)
3. **Implementieren:** Code schreiben → echte Lösung, keine Shortcuts
4. **Clean up**: Code nochmals prüfen, aufräumen und sonstiges Cleanup
5. **Quality Gates:**
   - `npm run lint` — KEINE neuen `eslint-disable` ohne Genehmigung!
   - `npm test` — Tests mit echtem Mehrwert (keine Coverage-Padding)
   - `npm run build` — Build muss durchlaufen
6. **Dokumentieren:** Feature nach "Erledigt" verschieben mit Datum - sauber dokumentieren für den nächsten Agenten
7. **Commit & Push**

---

## Offen

### Auth vollständig Implementieren

- Server Actions absichern (aktuell nur UI-basierte Autorisierung)
- Login/Logout implementieren
- Session-Management
- Rollen-basierte Berechtigungen durchsetzen

### UX verbessern

- Weitere UX-Verbesserungen identifizieren und umsetzen

### Administration (Settings) Implementieren

- Globale Einstellungen verwalten

---

## Erledigt

### Kommentare zu Issues löschbar ✅ (2026-01-12)

- Delete-Button für Kommentare hinzugefügt (nur für den Autor sichtbar)
- Nutzt bestehende `deleteComment` Server-Action
- Optimistische UI-Updates (Kommentar verschwindet sofort)
- Fehlerbehandlung integriert

### Markdown in Issues Beschreibung korrekt rendern ✅ (2026-01-12)

- `react-markdown` + `remark-gfm` installiert
- Wiederverwendbare `<Markdown>` Komponente in `src/components/ui/markdown.tsx`
- Issue-Beschreibungen und Kommentare rendern jetzt Markdown (Code, Listen, Links, Tabellen etc.)
- Eigene `prose` CSS-Styles in globals.css (Tailwind v4 kompatibel)

### Test Coverage ✅ (2026-01-12)

- **Ziel 35% → Erreicht 98.69%**
- Alle lib-Module und types vollständig getestet
- 213 Unit-Tests, alle grün

### Bug Hunt ✅ (2026-01-12)

- Umfassende Codebase-Analyse: Keine kritischen Bugs
- Geprüft: Leere catch-Blöcke, TypeScript Hacks, XSS, Race Conditions, Null-Returns, Input Validierung
- Delete Handler Error Handling verbessert (4 Dateien)
- isOverdue() Bug gefixt (ignorierte `resolved` Status)

### Code Quality / DRY ✅ (2026-01-12/13)

- Zentralisiert: `getInitials()`, `formatDate()`, `generateId()`, `getFullName()`, `isOverdue()`
- Zentralisiert: Label-Konstanten, Form Options, Badge Colors, Email Regex
- Komponenten: `FormFieldError`, `GeneralFormError`, `SortableTableHeader`, `FilterDropdown`, `StatCard`
- Hooks: `useFormField()`
- Server Action Error Handler konsolidiert
- ~400+ Zeilen duplizierter Code entfernt

### Design optimieren ✅ (2026-01-12)

- Dark Mode mit System-Präferenz + localStorage-Persistenz
- FOUC-Prevention via Inline-Script

### Dokumentation ✅ (2026-01-12)

- README.md projektspezifisch aktualisiert
- Keyboard Shortcuts dokumentiert
- Docker-Anweisungen hinzugefügt

---

## Routine-Checks

<!-- Bei JEDER Iteration prüfen und ggf Änderungen durchführen wenn notwendig -->

- [ ] Gibt es offensichtliche Verbesserungen für diese PRD?
- [ ] Fehlt ein wichtiges Feature in der "Offen"-Liste?
