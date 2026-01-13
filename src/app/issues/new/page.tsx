import { Suspense } from 'react'
import { getUsers } from '@/app/actions/users'
import { getProjects } from '@/app/actions/projects'
import { IssueForm } from './issue-form'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ project?: string }>
}

export default async function NewIssuePage({ searchParams }: Props) {
  const params = await searchParams
  const [users, projects] = await Promise.all([
    getUsers(),
    getProjects(),
  ])

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

  const currentUserId = users[0]?.id ?? ''

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <IssueForm
        users={serializedUsers}
        projects={serializedProjects}
        defaultProjectId={params.project}
        currentUserId={currentUserId}
      />
    </Suspense>
  )
}
