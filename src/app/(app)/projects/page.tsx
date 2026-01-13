import { getProjects } from '@/app/actions/projects'
import { prisma } from '@/lib/db'
import { ProjectsList, SerializedProject, SerializedIssueForStats } from './projects-list'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await getProjects()
  
  const issues = await prisma.issue.findMany({
    select: {
      id: true,
      projectId: true,
      status: true,
      tracker: true,
    },
  })

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
