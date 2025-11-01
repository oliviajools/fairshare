/*
  Warnings:

  - You are about to drop the column `note` on the `Ballot` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ballot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ballot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ballot_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ballot" ("createdAt", "id", "participantId", "sessionId", "status", "submittedAt", "tokenHash", "updatedAt") SELECT "createdAt", "id", "participantId", "sessionId", "status", "submittedAt", "tokenHash", "updatedAt" FROM "Ballot";
DROP TABLE "Ballot";
ALTER TABLE "new_Ballot" RENAME TO "Ballot";
CREATE UNIQUE INDEX "Ballot_tokenHash_key" ON "Ballot"("tokenHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
