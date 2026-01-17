-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "instanceName" TEXT NOT NULL DEFAULT 'Blackmine',
    "defaultIssueTracker" TEXT NOT NULL DEFAULT 'bug',
    "defaultIssuePriority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
