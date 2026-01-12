import { getTimeEntries } from '@/app/actions/time-entries'
import { getUsers } from '@/app/actions/users'
import { TimeList, SerializedTimeEntry, SerializedUser } from './time-list'
import type { ActivityType } from '@/types'

export default async function TimePage() {
  const [timeEntries, users] = await Promise.all([
    getTimeEntries(),
    getUsers(),
  ])

  // Serialize for client component
  const serializedEntries = timeEntries.map((entry): SerializedTimeEntry => ({
    id: entry.id,
    issueId: entry.issueId,
    userId: entry.userId,
    hours: entry.hours,
    activityType: entry.activityType as ActivityType,
    spentOn: entry.spentOn.toISOString(),
    comments: entry.comments,
    createdAt: entry.createdAt.toISOString(),
    issue: {
      id: entry.issue.id,
      subject: entry.issue.subject,
      project: {
        id: entry.issue.project.id,
        name: entry.issue.project.name,
        identifier: entry.issue.project.identifier,
      },
    },
    user: {
      id: entry.user.id,
      firstName: entry.user.firstName,
      lastName: entry.user.lastName,
      email: entry.user.email,
      role: entry.user.role,
    },
  }))

  const serializedUsers: SerializedUser[] = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  }))

  return <TimeList timeEntries={serializedEntries} users={serializedUsers} />
}
