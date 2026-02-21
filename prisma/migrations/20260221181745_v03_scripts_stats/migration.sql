-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScriptStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
    "matchedRows" INTEGER NOT NULL DEFAULT 0,
    "uploadCount" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "impressions" REAL NOT NULL DEFAULT 0,
    "clicks" REAL NOT NULL DEFAULT 0,
    "customers" REAL NOT NULL DEFAULT 0,
    "lowCourseCount" REAL NOT NULL DEFAULT 0,
    "lowCourseRevenue" REAL NOT NULL DEFAULT 0,
    "wechatFollowers" REAL NOT NULL DEFAULT 0,
    "activations" REAL NOT NULL DEFAULT 0,
    "additions" REAL NOT NULL DEFAULT 0,
    "groupJoins" REAL NOT NULL DEFAULT 0,
    "deepUsers" REAL NOT NULL DEFAULT 0,
    "highCourseCount" REAL NOT NULL DEFAULT 0,
    "day3HighCourse" REAL NOT NULL DEFAULT 0,
    "day4HighCourse" REAL NOT NULL DEFAULT 0,
    "day5HighCourse" REAL NOT NULL DEFAULT 0,
    "highCourseRevenue" REAL NOT NULL DEFAULT 0,
    "refunds" REAL NOT NULL DEFAULT 0,
    "clickRate" REAL,
    "playRate3s" REAL,
    "playRate" REAL,
    "conversionRate" REAL,
    "landingConvRate" REAL,
    "wechatFollowRate" REAL,
    "activationRate" REAL,
    "additionRate" REAL,
    "groupJoinRate" REAL,
    "day1PlayRate" REAL,
    "day2PlayRate" REAL,
    "day3PlayRate" REAL,
    "day4PlayRate" REAL,
    "day5PlayRate" REAL,
    "deepRate" REAL,
    "day3DeepPlayRate" REAL,
    "day3DeepConvRate" REAL,
    "highCoursePayRate" REAL,
    "refundRate" REAL,
    "customerCost" REAL,
    "avgImpressionCost" REAL,
    "avgClickCost" REAL,
    "activationCost" REAL,
    "additionCost" REAL,
    "roi" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScriptStat_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Script_name_key" ON "Script"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptStat_scriptId_key" ON "ScriptStat"("scriptId");
