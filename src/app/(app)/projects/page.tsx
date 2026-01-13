import { getProjects } from '@/app/actions/projects'
import { prisma } from '@/lib/db'
import { ProjectsList, SerializedProject, SerializedIssueForStats } from './projects-list'

// Force dynamic rendering - data comes from runtime database, not build-time
export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  // Fetch projects from database
  const projects = await getProjects()
  
  // Fetch all issues for stats calculation
  const issues = await prisma.issue.findMany({
    select: {
      id: true,
      projectId: true,
      status: true,
      tracker: true,
    },
  })

  // Serialize dates for client component
  const serializedProjects: SerializedProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    identifier: p.identifier,
    description: p.description,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    _count: p._count,
  }))

  const serializedIssues: SerializedIssueForStats[] = issues.map((i) => ({
    id: i.id,
    projectId: i.projectId,
    status: i.status,
    tracker: i.tracker,
  }))

  return (
    <ProjectsList
      projects={serializedProjects}
      issues={serializedIssues}
      totalCount={projects.length}
    />
  )
}
