import { notFound } from 'next/navigation'
import { getProjectByIdentifier } from '@/app/actions/projects'
import { ProjectEditForm, type SerializedProject } from './project-edit-form'

interface EditProjectPageProps {
  params: Promise<{ identifier: string }>
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { identifier } = await params
  const project = await getProjectByIdentifier(identifier)

  if (!project) {
    notFound()
  }

  // Serialize dates for client component
  const serializedProject: SerializedProject = {
    id: project.id,
    name: project.name,
    identifier: project.identifier,
    description: project.description,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }

  return <ProjectEditForm project={serializedProject} />
}
