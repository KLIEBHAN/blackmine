'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Upload, Database, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { exportDatabase, importDatabase, type DatabaseExport } from '@/app/actions/database'

interface DatabaseManagerProps {
  initialStats: Record<string, number>
}

export function DatabaseManager({ initialStats }: DatabaseManagerProps) {
  const router = useRouter()
  const [stats, setStats] = useState(initialStats)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingImport, setPendingImport] = useState<DatabaseExport | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setIsExporting(true)
    try {
      const data = await exportDatabase()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `redmine-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Database exported successfully')
    } catch {
      toast.error('Failed to export database')
    } finally {
      setIsExporting(false)
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as DatabaseExport

      if (!data.version || !data.data) {
        toast.error('Invalid backup file format')
        return
      }

      setPendingImport(data)
      setShowConfirmDialog(true)
    } catch {
      toast.error('Failed to read backup file')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function confirmImport() {
    if (!pendingImport) return

    setShowConfirmDialog(false)
    setIsImporting(true)

    try {
      const result = await importDatabase(pendingImport)

      if (result.success && result.counts) {
        setStats(result.counts)
        toast.success(
          `Imported: ${result.counts.users} users, ${result.counts.projects} projects, ${result.counts.issues} issues`
        )
        router.refresh()
      } else {
        toast.error(result.error ?? 'Import failed')
      }
    } catch {
      toast.error('Failed to import database')
    } finally {
      setIsImporting(false)
      setPendingImport(null)
    }
  }

  const statLabels: Record<string, string> = {
    users: 'Users',
    projects: 'Projects',
    issues: 'Issues',
    timeEntries: 'Time Entries',
    comments: 'Comments',
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="size-5" />
              Export Database
            </CardTitle>
            <CardDescription>
              Download a complete backup of all data as JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Import Database
            </CardTitle>
            <CardDescription>
              Restore data from a JSON backup file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              variant="outline"
              className="w-full"
            >
              {isImporting ? 'Importing...' : 'Select Backup File'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Current Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{statLabels[key] ?? key}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Confirm Import
            </DialogTitle>
            <DialogDescription>
              This will <strong>permanently delete all existing data</strong> and replace it with
              the backup. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {pendingImport && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <div className="font-medium mb-2">Backup contains:</div>
              <ul className="space-y-1">
                <li>{pendingImport.data.users.length} users</li>
                <li>{pendingImport.data.projects.length} projects</li>
                <li>{pendingImport.data.issues.length} issues</li>
                <li>{pendingImport.data.timeEntries.length} time entries</li>
                <li>{pendingImport.data.comments.length} comments</li>
              </ul>
              <div className="mt-2 text-muted-foreground">
                Exported: {new Date(pendingImport.exportedAt).toLocaleString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmImport}>
              Delete All & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
