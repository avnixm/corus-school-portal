-- Promissory notes: full amount + installment schedule
ALTER TABLE "promissory_notes" ALTER COLUMN "amount_promised" DROP NOT NULL;
ALTER TABLE "promissory_notes" ALTER COLUMN "due_date" DROP NOT NULL;
ALTER TABLE "promissory_notes" ADD COLUMN IF NOT EXISTS "total_outstanding_amount" numeric(12, 2);
ALTER TABLE "promissory_notes" ADD COLUMN IF NOT EXISTS "total_promised_amount" numeric(12, 2);
ALTER TABLE "promissory_notes" ADD COLUMN IF NOT EXISTS "installment_months" integer;
ALTER TABLE "promissory_notes" ADD COLUMN IF NOT EXISTS "installment_schedule" jsonb;
ALTER TABLE "promissory_notes" ADD COLUMN IF NOT EXISTS "start_date" date;
ALTER TABLE "promissory_notes" ADD COLUMN IF NOT EXISTS "final_due_date" date;
