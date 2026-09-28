-- AlterTable
ALTER TABLE "scheme_versions" ADD COLUMN     "applicationDeadline" TIMESTAMP(3),
ADD COLUMN     "applicationOpenDate" TIMESTAMP(3),
ADD COLUMN     "selectionConfig" JSONB;
