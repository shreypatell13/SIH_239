-- Drop the unconditional unique index on applications(applicantProfileId, schemeVersionId)
DROP INDEX IF EXISTS "applications_applicantProfileId_schemeVersionId_key";

-- Create a partial unique index allowing only one active (non-WITHDRAWN) application per profile per scheme version
CREATE UNIQUE INDEX "applications_active_applicant_scheme_version_unique" 
ON "applications"("applicantProfileId", "schemeVersionId") 
WHERE "status" != 'WITHDRAWN';

-- Create an index on (applicantProfileId, schemeVersionId) for efficient query of all attempts
CREATE INDEX IF NOT EXISTS "applications_applicantProfileId_schemeVersionId_idx" 
ON "applications"("applicantProfileId", "schemeVersionId");
