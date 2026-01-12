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

### Performance-Optimierungen

### Code Quality

- **Code smells beseitigen:** Schlechte Patterns korrigieren, Lesbarkeit verbessern (aussagekräftige Bezeichner, kleine fokussierte Funktionen, Kommentare für das "Warum"). Bestehende Logik nicht brechen.

### Test Coverage prüfen und wenn nötig erhöhen

- Test Coverage auf mindestens 35% bringen
- Fokus auf Services mit Business-Logik, nicht auf Coverage-Padding

### Bug hunt

- Scanne die Codebase nach Bugs (Null/Undefined, async races, error handling, parsing, state consistency, security). Pro Bug: Ort, Symptom, Root Cause, Fix, Test. Priorisiere P0-P2. Nur Bugs fixen, die vollständig verstanden sind.

### Dokumentation verbessern

- Prüfe die Dokumentation und vergleiche mit den Code
- Verbessere die Dokumentation wo es sinnvoll ist und einen Mehrwert bringt
- Wenn du eindeutige Fehler oder Inkonsistenzen bemerkst, fixe diese

### Lesbarkeit des Codes

- Bitte optimiere diesen Code für maximale Lesbarkeit und Verständlichkeit. Achte auf aussagekräftige, konsistente Bezeichner, vermeide unnötige Komplexität und erstelle gegebenenfalls kleine, fokussierte Funktionen. Ergänze kurze, sinnvolle Kommentare, die das ‚Warum‘ statt das ‚Wie‘ hervorheben. Erkläre abschließend, wie deine Änderungen die Verständlichkeit und Wartbarkeit verbessern.

### Komplexität reduzieren

- Bitte suche nach unnötiger Komplexität und Redundanz. Erkläre mir dann bitte genau, wie dies zustande kommt und was die wahrscheinlichsten Ursachen sind.
- Versuche es dann besser zu lösen und zu vereinheitlichen.

### Design optimieren

- Kannst Du prüfen ob wir das Design noch optisch schöner gestalten können?
- Dark mode als Standard setzen bzw Systemeinstellungen übernehmen

### Auth vollständig Implementieren

### UX verbessern

### Markdown Code in Issues Beschreibung korrekt rendern

---

## Routine-Checks

<!-- Bei JEDER Iteration prüfen und ggf Änderungen durchführen wenn notwendig -->

- [ ] Gibt es offensichtliche Verbesserungen für diese PRD?
- [ ] Fehlt ein wichtiges Feature in der "Offen"-Liste?
