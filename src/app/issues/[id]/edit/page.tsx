import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getIssueById } from '@/app/actions/issues'
import { getUsers } from '@/app/actions/users'
import { getProjects } from '@/app/actions/projects'
import { IssueEditForm } from './issue-edit-form'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditIssuePage({ params }: Props) {
  const { id } = await params
  const [issue, users, projects] = await Promise.all([
    getIssueById(id),
    getUsers(),
    getProjects(),
  ])

  if (!issue) {
    notFound()
  }

  // Serialize for client component (Date → string)
  const serializedIssue = {
    id: issue.id,
    subject: issue.subject,
    description: issue.description,
    tracker: issue.tracker,
    status: issue.status,
    priority: issue.priority,
    projectId: issue.projectId,
    assigneeId: issue.assigneeId,
    dueDate: issue.dueDate ? issue.dueDate.toISOString().split('T')[0] : null,
    estimatedHours: issue.estimatedHours,
  }

  const serializedUsers = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
  }))

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
  }))

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <IssueEditForm
        issue={serializedIssue}
        users={serializedUsers}
        projects={serializedProjects}
      />
    </Suspense>
  )
}
