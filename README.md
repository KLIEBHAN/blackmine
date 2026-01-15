# Blackmine

A modern project management application inspired by Redmine, built with Next.js 16, React 19, and TypeScript.

## Features

- **Projects** - Create, edit, and manage projects with descriptions and status tracking
- **Issues** - Full issue tracking with priorities, statuses, and assignments
- **Quick Search** - Live search in sidebar with keyboard navigation (`/` to focus, `↑↓` to navigate, `Enter` to select)
- **Time Tracking** - Log time entries against issues for project accounting
- **Comments** - Add comments to issues for collaboration
- **Users** - User management with roles and assignments
- **Dashboard** - Overview of recent activity and project statistics
- **Font Size Control** - Adjustable text size in issue detail view (persisted in browser)
- **Markdown Support** - Full Markdown in descriptions and comments with syntax highlighting for code blocks

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4, Radix UI
- **Database:** SQLite via libSQL/Turso with Prisma ORM
- **Testing:** Vitest (98%+ coverage), Playwright for E2E
- **Linting:** ESLint 9

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations and seed demo data
npm run db:reset
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (watch mode) |
| `npm run test:run` | Run unit tests once |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:reset` | Reset and reseed database |

## Project Structure

```
src/
├── app/           # Next.js App Router pages and actions
│   ├── actions/   # Server actions for data mutations
│   ├── issues/    # Issue management pages
│   ├── projects/  # Project management pages
│   └── time/      # Time tracking pages
├── components/    # Reusable UI components
├── lib/           # Business logic, validation, data access
├── hooks/         # Custom React hooks
└── types/         # TypeScript type definitions
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search input |
| `↑` `↓` | Navigate search results |
| `Enter` | Open selected issue |
| `Escape` | Close search dropdown |

## Accessibility

- **Font Size**: In the issue detail view, use the `−` / `+` buttons next to "Description" to adjust text size (Klein, Normal, Groß, Sehr groß). Your preference is saved in the browser.

## Markdown in Descriptions

Issue descriptions and comments support full Markdown with syntax highlighting for code blocks.

### Supported Formatting

- **Bold**: `**text**`
- *Italic*: `*text*`
- ~~Strikethrough~~: `~~text~~`
- `Inline code`: `` `code` ``
- [Links](https://example.com): `[text](url)`
- Lists, blockquotes, tables (GFM)

### Code Blocks with Syntax Highlighting

Use fenced code blocks with a language identifier for syntax highlighting:

````markdown
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```
````

Supported languages include: `javascript`, `typescript`, `python`, `java`, `go`, `rust`, `sql`, `bash`, `json`, `yaml`, `html`, `css`, and many more.

### Example Issue Description

````markdown
## Bug Description

The login form crashes when submitting empty credentials.

## Steps to Reproduce

1. Open `/login`
2. Leave fields empty
3. Click "Submit"

## Error

```javascript
TypeError: Cannot read property 'email' of undefined
    at validateForm (auth.js:42)
```

## Expected Behavior

Show validation error message.
````

## Testing

```bash
# Run all tests with coverage
npm test -- --coverage

# Run specific test file
npm test src/lib/issues.test.ts
```

## Docker

### Quick Start

```bash
docker compose up -d --build
```

App available at [http://localhost:41314](http://localhost:41314).

### Database Backup & Restore

```bash
# Export database
./scripts/db-export.sh ./backups

# Import database
./scripts/db-import.sh ./backups/redmine_backup_20240115_120000.db
```

### Manual Database Setup

```bash
# Apply migrations manually
docker compose exec app npx prisma migrate deploy

# Seed demo data (requires running container with tsx)
docker compose exec app npx tsx prisma/seed.ts
```

## License

MIT
