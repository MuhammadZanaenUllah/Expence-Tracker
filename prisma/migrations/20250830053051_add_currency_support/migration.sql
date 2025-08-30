-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'USD';
