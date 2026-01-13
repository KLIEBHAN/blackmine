import { notFound } from 'next/navigation'
import { getProjectByIdentifier } from '@/app/actions/projects'
import { ProjectDetail, type SerializedProject, type SerializedIssue } from './project-detail'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

interface ProjectDetailPageProps {
  params: Promise<{ identifier: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { identifier } = await params
  const project = await getProjectByIdentifier(identifier)

  if (!project) {
    notFound()
  }

  // Serialize dates for client component
  const serializedIssues: SerializedIssue[] = project.issues.map((issue) => ({
    id: issue.id,
    subject: issue.subject,
    tracker: issue.tracker,
    status: issue.status,
    priority: issue.priority,
    updatedAt: issue.updatedAt.toISOString(),
    author: {
      id: issue.author.id,
      firstName: issue.author.firstName,
      lastName: issue.author.lastName,
    },
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          firstName: issue.assignee.firstName,
          lastName: issue.assignee.lastName,
        }
      : null,
  }))

  const serializedProject: SerializedProject = {
    id: project.id,
    name: project.name,
    identifier: project.identifier,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    issues: serializedIssues,
  }

  return <ProjectDetail project={serializedProject} />
}
