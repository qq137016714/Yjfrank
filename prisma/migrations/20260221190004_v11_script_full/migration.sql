/*
  Warnings:

  - Added the required column `updatedAt` to the `Script` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ScriptToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ScriptToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Script" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ScriptToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "frontContent" TEXT,
    "midContent" TEXT,
    "endContent" TEXT,
    "parentId" TEXT,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Script_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Script" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Script_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Script" ("createdAt", "updatedAt", "id", "name") SELECT "createdAt", "createdAt", "id", "name" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
CREATE UNIQUE INDEX "Script_name_key" ON "Script"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ScriptToTag_AB_unique" ON "_ScriptToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ScriptToTag_B_index" ON "_ScriptToTag"("B");
