/*
  Warnings:

  - The `spice_level` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "spice_level",
ADD COLUMN     "spice_level" INTEGER DEFAULT 1;
