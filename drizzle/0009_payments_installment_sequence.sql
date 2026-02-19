-- Link payment to promissory note installment (1-6)
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "installment_sequence" integer;
