import { Suspense } from 'react'
import { getIssues } from '@/app/actions/issues'
import { getProjects } from '@/app/actions/projects'
import { TimeEntryForm } from './time-entry-form'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ issue?: string }>
}

export default async function NewTimeEntryPage({ searchParams }: Props) {
  const params = await searchParams
  const preselectedIssueId = params.issue ?? ''

  const [issues, projects] = await Promise.all([
    getIssues(),
    getProjects(),
  ])

  const serializedIssues = issues.map((issue) => ({
    id: issue.id,
    subject: issue.subject,
    projectId: issue.projectId,
  }))

  const serializedProjects = projects.map((project) => ({
    id: project.id,
    name: project.name,
  }))

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <TimeEntryForm
        issues={serializedIssues}
        projects={serializedProjects}
        preselectedIssueId={preselectedIssueId}
      />
    </Suspense>
  )
}
