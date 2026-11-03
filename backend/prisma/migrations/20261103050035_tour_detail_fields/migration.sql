-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "albums" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "previousTour" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportingArtists" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "tourCities" TEXT NOT NULL DEFAULT '[]';
