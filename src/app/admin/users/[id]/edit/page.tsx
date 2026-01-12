import { notFound } from 'next/navigation'
import { getUserById } from '@/app/actions/users'
import { UserEditForm, type SerializedUser } from './user-edit-form'
import { UserRole } from '@/types'

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) {
    notFound()
  }

  // Serialize for client component
  const serializedUser: SerializedUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
  }

  return <UserEditForm user={serializedUser} />
}
