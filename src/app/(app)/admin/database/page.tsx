import { getDatabaseStats } from '@/app/actions/database'
import { DatabaseManager } from './database-manager'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

export default async function AdminDatabasePage() {
  const stats = await getDatabaseStats()

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Database Management</h1>
          <p className="text-muted-foreground">Export and import your database backups</p>
        </div>
        <DatabaseManager initialStats={stats} />
      </div>
    </div>
  )
}
