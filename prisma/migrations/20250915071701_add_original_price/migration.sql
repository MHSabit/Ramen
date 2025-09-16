/*
  Warnings:

  - The `original_price` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "original_price",
ADD COLUMN     "original_price" INTEGER DEFAULT 0;
