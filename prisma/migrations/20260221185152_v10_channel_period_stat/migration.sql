-- CreateTable
CREATE TABLE "ChannelPeriodStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
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
    CONSTRAINT "ChannelPeriodStat_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ExcelUpload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPeriodStat_channel_uploadId_key" ON "ChannelPeriodStat"("channel", "uploadId");
