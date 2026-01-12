'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { type UserRole, type SortDirection, getFullName } from '@/types'
import {
  filterUsers,
  sortUsers,
  type UserFilters,
  type UserSortField,
} from '@/lib/users'
import { deleteUser } from '@/app/actions/users'
import {
  Users,
  Search,
  Plus,
  X,
  Shield,
  ShieldCheck,
  Code,
  FileText,
  Mail,
  Trash2,
} from 'lucide-react'
import { SortIcon } from '@/components/ui/sort-icon'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getInitials, formatDate } from '@/lib/utils'

// Serialized type for client-side (dates as strings)
export type SerializedUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
  reporter: 'Reporter',
}

const roleIcons: Record<UserRole, typeof Shield> = {
  admin: ShieldCheck,
  manager: Shield,
  developer: Code,
  reporter: FileText,
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  reporter: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
}

const allRoles: UserRole[] = ['admin', 'manager', 'developer', 'reporter']

interface UserSort {
  field: UserSortField
  direction: SortDirection
}

interface UsersListProps {
  initialUsers: SerializedUser[]
}

export function UsersList({ initialUsers }: UsersListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [sort, setSort] = useState<UserSort>({ field: 'lastName', direction: 'asc' })
  const [users, setUsers] = useState(initialUsers)
  const [userToDelete, setUserToDelete] = useState<SerializedUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Build filters
  const filters: UserFilters = useMemo(() => ({
    role: (selectedRole as UserRole) || undefined,
    search: search || undefined,
  }), [search, selectedRole])

  // Convert serialized users to format expected by filterUsers/sortUsers
  const usersForFiltering = useMemo(() => 
    users.map(u => ({
      ...u,
      createdAt: new Date(u.createdAt),
    })), 
    [users]
  )

  // Apply filters and sorting
  const filteredUsers = useMemo(() => {
    const filtered = filterUsers(usersForFiltering, filters)
    const sorted = sortUsers(filtered, sort.field, sort.direction)
    // Convert back to serialized format
    return sorted.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }))
  }, [usersForFiltering, filters, sort])

  const hasFilters = selectedRole || search

  const clearFilters = () => {
    setSelectedRole('')
    setSearch('')
  }

  const toggleSort = (field: UserSortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    
    const result = await deleteUser(userToDelete.id)
    
    if (result.success) {
      toast.success(`User "${getFullName(userToDelete)}" deleted`)
      setUsers(users.filter(u => u.id !== userToDelete.id))
      setUserToDelete(null)
      router.refresh()
    } else if ('error' in result) {
      toast.error(result.error)
    }
    
    setIsDeleting(false)
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="font-medium text-sm">{getFullName(userToDelete)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {userToDelete.email} • {roleLabels[userToDelete.role]}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:text-primary">Dashboard</Link>
            <span>/</span>
            <span>Administration</span>
            <span>/</span>
            <span className="text-foreground">Users</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{filteredUsers.length}</span> users
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/users/new">
            <Plus className="size-4" />
            New User
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6 opacity-0 animate-card-in delay-1">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 font-sans"
              />
            </div>

            {/* Role Filter */}
            <Select 
              value={selectedRole || '__all__'} 
              onValueChange={(v) => setSelectedRole(v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-[160px] gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Roles</SelectItem>
                {allRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="opacity-0 animate-card-in delay-2">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] pl-4 font-semibold">
                  <button
                    onClick={() => toggleSort('lastName')}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    Name
                    <SortIcon field="lastName" currentField={sort.field} direction={sort.direction} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">
                  <button
                    onClick={() => toggleSort('email')}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    Email
                    <SortIcon field="email" currentField={sort.field} direction={sort.direction} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">
                  <button
                    onClick={() => toggleSort('role')}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    Role
                    <SortIcon field="role" currentField={sort.field} direction={sort.direction} />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">
                  <button
                    onClick={() => toggleSort('createdAt')}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    Created
                    <SortIcon field="createdAt" currentField={sort.field} direction={sort.direction} />
                  </button>
                </TableHead>
                <TableHead className="pr-4 text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-8 opacity-50" />
                      <p>No users found</p>
                      {hasFilters && (
                        <Button variant="link" size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => {
                  const RoleIcon = roleIcons[user.role]
                  const fullName = getFullName(user)

                  return (
                    <TableRow
                      key={user.id}
                      className="group animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* Name */}
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{fullName}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {user.id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <a 
                            href={`mailto:${user.email}`}
                            className="text-sm hover:text-primary hover:underline"
                          >
                            {user.email}
                          </a>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`gap-1.5 rounded px-2 py-0.5 text-xs ${roleColors[user.role]}`}
                        >
                          <RoleIcon className="size-3" />
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>

                      {/* Created */}
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatDate(user.createdAt, 'medium')}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/users/${user.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Summary */}
          {filteredUsers.length > 0 && (
            <div className="border-t bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Showing {filteredUsers.length} of {users.length} users
                </span>
                <div className="flex gap-3">
                  {allRoles.map((role) => {
                    const count = filteredUsers.filter(u => u.role === role).length
                    if (count === 0) return null
                    return (
                      <span key={role} className="text-muted-foreground">
                        {roleLabels[role]}: <span className="font-mono font-medium text-foreground">{count}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
