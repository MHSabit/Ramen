-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_first_name" TEXT,
ADD COLUMN     "contact_last_name" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "shipping_address" TEXT,
ADD COLUMN     "shipping_city" TEXT,
ADD COLUMN     "shipping_cost" DECIMAL(10,2),
ADD COLUMN     "shipping_days" TEXT,
ADD COLUMN     "shipping_method" TEXT,
ADD COLUMN     "shipping_state" TEXT,
ADD COLUMN     "shipping_zip_code" TEXT;
