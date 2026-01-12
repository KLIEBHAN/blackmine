import { Suspense } from 'react'
import { getIssues } from '@/app/actions/issues'
import { getProjects } from '@/app/actions/projects'
import { getUsers } from '@/app/actions/users'
import { TimeEntryForm } from './time-entry-form'

type Props = {
  searchParams: Promise<{ issue?: string }>
}

export default async function NewTimeEntryPage({ searchParams }: Props) {
  const params = await searchParams
  const preselectedIssueId = params.issue ?? ''

  const [issues, projects, users] = await Promise.all([
    getIssues(),
    getProjects(),
    getUsers(),
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

  const currentUserId = users[0]?.id ?? ''

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <TimeEntryForm
        issues={serializedIssues}
        projects={serializedProjects}
        preselectedIssueId={preselectedIssueId}
        currentUserId={currentUserId}
      />
    </Suspense>
  )
}
