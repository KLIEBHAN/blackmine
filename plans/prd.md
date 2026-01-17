# PRD

## Workflow (must do!!!!)

1. **Status:** Wichtig: `git diff` prüfen → bei Änderungen: genau prüfen, passende Tests (`npm test`) und commiten/pushen
2. **Feature:** EIN Feature aus "Offen" wählen (höchste Priorität zuerst - bewerte selbst)
3. **Implementieren:** Code schreiben → echte Lösung, keine Shortcuts - Testen mit Playwright auf http://localhost:3000/ ist möglich
4. **Clean up**: Code nochmals prüfen, aufräumen und sonstiges Cleanup
5. **Quality Gates:**
   - `npm run lint` — KEINE neuen `eslint-disable` ohne Genehmigung!
   - `npm test` — Tests mit echtem Mehrwert (keine Coverage-Padding)
   - `npm run build` — Build muss durchlaufen
6. **Dokumentieren:** Feature nach "Erledigt" verschieben mit Datum - sauber dokumentieren für den nächsten Agenten
7. **Commit & Push**

---

## Offen

### UX verbessern

- Weitere UX-Verbesserungen identifizieren und umsetzen

### Administration (Settings) Implementieren

- Globale Einstellungen verwalten

---

## Erledigt

### UX: Issue-Suche findet IDs ✅ (2026-01-17)

- `filterIssues` berücksichtigt jetzt Issue-ID beim Suchen
- Test ergänzt für ID-Suche

### Auth: UI Rollen-Berechtigungen ✅ (2026-01-13)

- **SessionContext:** `SessionProvider` + `useSession()` Hook für Client-Komponenten
- **UI-Sichtbarkeit basierend auf Rolle:**
  - Admin-Bereich in Sidebar nur für Admins
  - "New Project" Button nur für Admin/Manager
  - Project Settings/Delete nur für Admin/Manager
  - Quick Actions "New Project" nur für Admin/Manager
- **Route Protection:** `/admin/*` serverseitig auf Admin-Rolle geprüft
- User-Name/Email in Sidebar aus echter Session

### Auth: Server Actions abgesichert ✅ (2026-01-13)

- **Issues:** createIssue, updateIssue, deleteIssue, bulkUpdateIssues - requireAuth()
- **Users:** createUser, updateUser, deleteUser - requireRole(['admin'])
- **Projects:** createProject, updateProject, deleteProject - requireRole(['admin', 'manager'])
- **Comments:** createComment (requireAuth), updateComment/deleteComment (Ownership-Check)
- **Time Entries:** createTimeEntry (requireAuth), deleteTimeEntry (Ownership-Check)
- **Database:** importDatabase - requireRole(['admin'])
- User-ID wird jetzt aus Session geholt statt als Parameter übergeben

### Auth Infrastruktur ✅ (2026-01-13)

- **Login/Logout implementiert:**
  - Login-Page unter `/login` mit Email/Password
  - Logout-Button im Header
  - Cookie-basierte Sessions (7 Tage, HttpOnly)
- **Session-Management:**
  - `getSession()`, `createSession()`, `destroySession()`
  - `requireAuth()`, `requireRole()` Helper
- **Route Protection:**
  - Route Groups: `(app)/` geschützt, `(auth)/` öffentlich
  - Automatischer Redirect zu `/login` für unauthentifizierte User
- **Password Hashing:**
  - PBKDF2 mit Web Crypto API (100k Iterations)
  - Prisma Schema: `passwordHash` Feld
- **Demo-Credentials:** admin@example.com / password123

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
