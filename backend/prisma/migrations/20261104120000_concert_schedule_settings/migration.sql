-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "scheduleAffiliateUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scheduleArtistQuery" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scheduleEndDate" TIMESTAMP(3),
ADD COLUMN     "schedulePerPage" INTEGER NOT NULL DEFAULT 24;
