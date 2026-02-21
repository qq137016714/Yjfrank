-- CreateTable
CREATE TABLE "ScriptChannelStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "matchedRows" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "impressions" REAL NOT NULL DEFAULT 0,
    "clicks" REAL NOT NULL DEFAULT 0,
    "customers" REAL NOT NULL DEFAULT 0,
    "highCourseRevenue" REAL NOT NULL DEFAULT 0,
    "lowCourseRevenue" REAL NOT NULL DEFAULT 0,
    "activations" REAL NOT NULL DEFAULT 0,
    "additions" REAL NOT NULL DEFAULT 0,
    "highCourseCount" REAL NOT NULL DEFAULT 0,
    "refunds" REAL NOT NULL DEFAULT 0,
    "clickRate" REAL,
    "playRate3s" REAL,
    "playRate" REAL,
    "conversionRate" REAL,
    "customerCost" REAL,
    "roi" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScriptChannelStat_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScriptChannelStat_scriptId_channel_key" ON "ScriptChannelStat"("scriptId", "channel");
