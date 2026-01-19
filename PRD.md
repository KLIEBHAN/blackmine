# Feature: Issue Status ändern

## Kontext
Blackmine ist ein Redmine-Clone. Issues haben bereits ein `status`-Feld im Schema mit den Werten:
- `new` (Neu)
- `in_progress` (In Bearbeitung)
- `resolved` (Gelöst)
- `closed` (Geschlossen)
- `rejected` (Abgelehnt)

**Problem:** Es gibt aktuell keine Möglichkeit, den Status eines Issues über die UI zu ändern.

## Ziel
Benutzer sollen den Status eines Issues direkt in der Issue-Detail-Ansicht ändern können.

## Technische Details
- Framework: Next.js 16 mit App Router, React 19, TypeScript
- UI: Radix UI, Tailwind CSS, shadcn/ui-Komponenten in `src/components/ui/`
- Server Actions in `src/app/actions/`
- Status-Labels definiert in `src/types/index.ts` als `statusLabels`

## Tasks

- [x] Server Action `updateIssueStatus` in `src/app/actions/issues.ts` erstellen. Die Action nimmt `issueId` und `status` entgegen, validiert den Status gegen die erlaubten Werte, aktualisiert das Issue in der Datenbank und gibt das aktualisierte Issue zurück. Bei Fehler soll ein ActionResult mit error zurückgegeben werden.

- [x] Status-Dropdown-Komponente in der Issue-Sidebar (`src/app/(app)/issues/[id]/issue-sidebar.tsx`) hinzufügen. Das Badge für den Status soll durch ein Select-Dropdown (aus `src/components/ui/select.tsx`) ersetzt werden. Bei Änderung wird die `updateIssueStatus` Server Action aufgerufen. Nutze `useTransition` für den Loading-State und zeige einen Toast bei Erfolg/Fehler (via `sonner`).

- [x] Unit-Tests für die `updateIssueStatus` Server Action in `src/app/actions/issues.test.ts` hinzufügen. Teste: erfolgreiche Status-Änderung, ungültiger Status wird abgelehnt, nicht-existierendes Issue gibt Fehler zurück.
