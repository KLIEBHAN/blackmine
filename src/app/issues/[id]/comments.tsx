'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { createComment, deleteComment } from '@/app/actions/comments'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { Markdown } from '@/components/ui/markdown'
import { getInitials, formatDate } from '@/lib/utils'
import { getFullName } from '@/types'

export type SerializedComment = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
}

interface CommentsProps {
  issueId: string
  comments: SerializedComment[]
  currentUserId: string
}

function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date, 'datetime')
}

export function Comments({ issueId, comments: initialComments, currentUserId }: CommentsProps) {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setError(null)

    const result = await createComment(issueId, currentUserId, { content: newComment })

    if (result.success && result.comment) {
      // Add new comment to local state
      const serializedComment: SerializedComment = {
        id: result.comment.id,
        content: result.comment.content,
        createdAt: result.comment.createdAt.toISOString(),
        updatedAt: result.comment.updatedAt.toISOString(),
        author: {
          id: result.comment.author.id,
          firstName: result.comment.author.firstName,
          lastName: result.comment.author.lastName,
        },
      }
      setComments([...comments, serializedComment])
      setNewComment('')
    } else if (result.errors) {
      const errors = result.errors as { content?: string; general?: string }
      setError(errors.content || errors.general || 'Failed to add comment')
    }

    setIsSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)
    setError(null)

    const result = await deleteComment(commentId)

    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId))
    } else if ('error' in result) {
      setError(result.error)
    }

    setDeletingId(null)
  }

  return (
    <Card className="opacity-0 animate-card-in delay-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="size-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="size-8 mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {getInitials(comment.author.firstName, comment.author.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {getFullName(comment.author)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(comment.createdAt)}
                      </span>
                      {comment.author.id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 ml-auto text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          title="Delete comment"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <Markdown>{comment.content}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Form */}
        <Separator className="my-4" />
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="resize-none"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newComment.trim()}
              className="gap-2"
            >
              <Send className="size-3.5" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
