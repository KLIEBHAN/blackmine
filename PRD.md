# Feature: Attachment-Preview Modal

## Kontext

In der Issue-Detailansicht werden PDF-Previews aktuell **inline** angezeigt (unter dem jeweiligen Attachment). Das führt zu:
- Begrenzter Platz (400-600px Höhe)
- Layout-Shift beim Öffnen/Schließen
- Scroll-Konflikte (Preview scrollt + Seite scrollt)
- Der eingebaute Fullscreen-Button wirkt aus dem kleinen Container heraus awkward

## Ziel

Attachment-Previews (PDF und Bilder) sollen in einem **Modal-Dialog** geöffnet werden statt inline. Das verbessert:
- Mehr Platz für die Preview
- Kein Layout-Shift
- Besserer Fokus auf das Dokument
- Natürlicherer Flow zu Fullscreen

## Technische Details

- Existierende Komponenten: `src/components/ui/dialog.tsx`, `src/components/ui/pdf-preview.tsx`
- Hook: `src/hooks/use-attachment-preview.ts` (verwaltet aktuell `previewAttachmentId`)
- Betroffene Views: `src/app/(app)/issues/[id]/issue-detail.tsx`, `src/app/(app)/issues/[id]/edit/issue-edit-form.tsx`

## Tasks

- [x] Erstelle eine `AttachmentPreviewDialog` Komponente in `src/components/ui/attachment-preview-dialog.tsx`. Die Komponente nimmt `attachment` (mit id, filename, contentType), `issueId`, `open` und `onOpenChange` als Props. Sie rendert einen Dialog (volle Breite/Höhe mit max-w-5xl) der je nach contentType entweder `PdfPreview` oder ein `<img>` anzeigt. Der Dialog-Header zeigt den Dateinamen und einen Download-Link.

- [x] Refactore `issue-detail.tsx`: Ersetze die Inline-Preview durch den neuen `AttachmentPreviewDialog`. Der Eye-Button soll `previewAttachmentId` setzen, was den Dialog öffnet. Entferne den Inline-Preview-Container (das `div` mit `h-[400px]`). Der Hook `useAttachmentPreview` bleibt unverändert – `previewAttachmentId` steuert jetzt welcher Dialog offen ist.

- [x] Refactore `issue-edit-form.tsx`: Gleiche Änderung wie in `issue-detail.tsx` – Inline-Preview durch Dialog ersetzen. Nutze ebenfalls `AttachmentPreviewDialog`.
