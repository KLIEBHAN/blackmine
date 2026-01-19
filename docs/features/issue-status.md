# Feature: Issue Status ändern

> **Status:** ✅ Completed (2026-01-19)
>
> This document is archived from the original PRD.md after all tasks were completed.
> For current implementation details, see the **Issue-Workflow** section in [CLAUDE.md](/CLAUDE.md).

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

- [x] Status-Feld im Issue-Edit-Formular (`src/app/(app)/issues/[id]/edit/issue-edit-form.tsx`) hinzufügen. Erweitere das `FormData` Type um `status: IssueStatus`. Initialisiere den Status aus `issue.status`. Füge ein Select-Dropdown für den Status hinzu (analog zu Tracker/Priority). Übergib den Status an die `updateIssue` Server Action. Platziere das Status-Select direkt nach dem Tracker-Select im Formular.

- [x] Die `updateIssue` Server Action in `src/app/actions/issues.ts` erweitern, sodass sie auch den `status` akzeptiert und in der Datenbank aktualisiert. Validiere den Status gegen `allIssueStatuses`. Aktualisiere auch den `IssueFormInput` Type entsprechend.

## Codeoptimierung

- [x] Extrahiere eine wiederverwendbare `StatusSelect`-Komponente aus der Issue-Sidebar nach `src/components/ui/status-select.tsx`. Die Komponente soll den aktuellen Status, einen onChange-Handler und optional einen disabled-State akzeptieren. Nutze sie dann sowohl in der Sidebar als auch im Edit-Formular, um Code-Duplikation zu vermeiden.

- [x] Prüfe die `bulkUpdateIssues` Action in `src/app/actions/issues.ts` – sie validiert den Status aktuell NICHT gegen `allIssueStatuses`. Füge die gleiche Validierung hinzu wie in `updateIssue` und `updateIssueStatus`.

## Dokumentation

- [x] Ergänze die CLAUDE.md um eine Sektion "Issue-Workflow", die erklärt: (1) welche Status-Werte existieren, (2) wie Status-Übergänge funktionieren (aktuell frei, später ggf. Workflow-Regeln), (3) wo die Status-Logik implementiert ist (types, actions, components).

## Aufräumarbeiten

- [x] Entferne die `progress.txt` Datei aus dem Repository (wurde von Ralphy erstellt, ist nicht mehr nötig). Füge `progress.txt` zur `.gitignore` hinzu.
