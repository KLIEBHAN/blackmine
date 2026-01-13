import { getUsers } from '@/app/actions/users'
import { UsersList, type SerializedUser } from './users-list'
import { UserRole } from '@/types'

export default async function AdminUsersPage() {
  const users = await getUsers()

  // Serialize for client component
  const serializedUsers: SerializedUser[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
  }))

  return (
    <div className="grid-pattern min-h-full">
      <div className="p-6 lg:p-8">
        <UsersList initialUsers={serializedUsers} />
      </div>
    </div>
  )
}
