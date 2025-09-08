-- AlterTable
ALTER TABLE "products" ADD COLUMN     "features" TEXT,
ADD COLUMN     "popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spice_level" TEXT;
