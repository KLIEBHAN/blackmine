import { getAppSettings } from '@/app/actions/settings'
import { SettingsForm } from './settings-form'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await getAppSettings()

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure global defaults for your instance</p>
        </div>
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  )
}
