import { getIssues } from '@/app/actions/issues'
import { IssuesList } from './issues-list'

// Serialize dates to strings for client component
function serializeIssue(issue: Awaited<ReturnType<typeof getIssues>>[number]) {
  return {
    ...issue,
    dueDate: issue.dueDate?.toISOString() ?? null,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    project: {
      id: issue.project.id,
      name: issue.project.name,
      identifier: issue.project.identifier,
    },
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
  }
}

export default async function IssuesPage() {
  const issues = await getIssues()
  const serializedIssues = issues.map(serializeIssue)

  return <IssuesList issues={serializedIssues} totalCount={issues.length} />
}
