-- CreateTable
CREATE TABLE "ExcelUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExcelUpload_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL DEFAULT '',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UploadTask_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ExcelUpload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExcelRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "materialName" TEXT NOT NULL,
    "deliveryDate" TEXT,
    "channel" TEXT,
    "totalCost" REAL,
    "impressions" REAL,
    "clickRate" REAL,
    "playRate3s" REAL,
    "playRate" REAL,
    "conversionRate" REAL,
    "clicks" REAL,
    "customers" REAL,
    "lowCourseCount" REAL,
    "landingConvRate" REAL,
    "lowCourseRevenue" REAL,
    "wechatFollowers" REAL,
    "wechatFollowRate" REAL,
    "activations" REAL,
    "activationRate" REAL,
    "additions" REAL,
    "additionRate" REAL,
    "groupJoins" REAL,
    "groupJoinRate" REAL,
    "day1PlayRate" REAL,
    "day2PlayRate" REAL,
    "day3PlayRate" REAL,
    "day4PlayRate" REAL,
    "day5PlayRate" REAL,
    "deepUsers" REAL,
    "deepRate" REAL,
    "day3DeepPlayRate" REAL,
    "day3DeepConvRate" REAL,
    "highCourseCount" REAL,
    "highCoursePayRate" REAL,
    "day3HighCourse" REAL,
    "day4HighCourse" REAL,
    "day5HighCourse" REAL,
    "highCourseRevenue" REAL,
    "refunds" REAL,
    "refundRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExcelRow_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "ExcelUpload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadTask_uploadId_key" ON "UploadTask"("uploadId");
