import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { webcrypto } from 'node:crypto'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:dev.db',
})
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const key = await webcrypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hashBuffer = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.comment.deleteMany()
  await prisma.timeEntry.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // Demo password for all users (in production, each user would have unique password)
  const demoPasswordHash = await hashPassword('password123')

  // Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: demoPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  })

  const devUser = await prisma.user.create({
    data: {
      email: 'developer@example.com',
      passwordHash: demoPasswordHash,
      firstName: 'John',
      lastName: 'Developer',
      role: 'developer',
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      passwordHash: demoPasswordHash,
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'manager',
    },
  })

  console.log(`✓ Created ${3} users`)

  // Create Projects
  const webProject = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      identifier: 'website-redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      status: 'active',
    },
  })

  const apiProject = await prisma.project.create({
    data: {
      name: 'API Development',
      identifier: 'api-dev',
      description: 'RESTful API for mobile and web applications',
      status: 'active',
    },
  })

  const mobileProject = await prisma.project.create({
    data: {
      name: 'Mobile App',
      identifier: 'mobile-app',
      description: 'Cross-platform mobile application using React Native',
      status: 'active',
    },
  })

  console.log(`✓ Created ${3} projects`)

  // Create Issues
  const issues = await Promise.all([
    prisma.issue.create({
      data: {
        tracker: 'bug',
        subject: 'Login button not responding on mobile',
        description: 'Users report that the login button does not respond to taps on iOS devices.',
        status: 'new',
        priority: 'high',
        projectId: webProject.id,
        authorId: devUser.id,
        assigneeId: devUser.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.issue.create({
      data: {
        tracker: 'feature',
        subject: 'Add dark mode support',
        description: 'Implement dark mode toggle with system preference detection.',
        status: 'in_progress',
        priority: 'normal',
        projectId: webProject.id,
        authorId: managerUser.id,
        assigneeId: devUser.id,
        estimatedHours: 16,
      },
    }),
    prisma.issue.create({
      data: {
        tracker: 'task',
        subject: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        status: 'resolved',
        priority: 'normal',
        projectId: apiProject.id,
        authorId: adminUser.id,
        assigneeId: devUser.id,
        estimatedHours: 8,
      },
    }),
    prisma.issue.create({
      data: {
        tracker: 'support',
        subject: 'Documentation for API endpoints',
        description: 'Create comprehensive documentation using OpenAPI/Swagger.',
        status: 'new',
        priority: 'low',
        projectId: apiProject.id,
        authorId: managerUser.id,
        assigneeId: null,
        estimatedHours: 12,
      },
    }),
    prisma.issue.create({
      data: {
        tracker: 'bug',
        subject: 'App crashes on Android 12',
        description: 'App crashes immediately after launch on Android 12 devices.',
        status: 'new',
        priority: 'urgent',
        projectId: mobileProject.id,
        authorId: devUser.id,
        assigneeId: devUser.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log(`✓ Created ${issues.length} issues`)

  // Create Time Entries
  const timeEntries = await Promise.all([
    prisma.timeEntry.create({
      data: {
        hours: 2.5,
        comments: 'Initial investigation of login issue',
        activityType: 'development',
        spentOn: new Date(),
        issueId: issues[0].id,
        userId: devUser.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        hours: 4,
        comments: 'Implemented dark mode toggle component',
        activityType: 'development',
        spentOn: new Date(),
        issueId: issues[1].id,
        userId: devUser.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        hours: 6,
        comments: 'CI/CD pipeline configuration complete',
        activityType: 'development',
        spentOn: new Date(Date.now() - 24 * 60 * 60 * 1000),
        issueId: issues[2].id,
        userId: devUser.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        hours: 1,
        comments: 'Code review for dark mode PR',
        activityType: 'review',
        spentOn: new Date(),
        issueId: issues[1].id,
        userId: managerUser.id,
      },
    }),
    prisma.timeEntry.create({
      data: {
        hours: 3,
        comments: 'Debugging Android crash',
        activityType: 'development',
        spentOn: new Date(),
        issueId: issues[4].id,
        userId: devUser.id,
      },
    }),
  ])

  console.log(`✓ Created ${timeEntries.length} time entries`)
  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
