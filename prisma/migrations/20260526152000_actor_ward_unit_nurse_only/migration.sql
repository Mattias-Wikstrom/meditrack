-- Nurses must have a ward unit; all other roles must not.
ALTER TABLE "Actor"
  ADD CONSTRAINT "Actor_ward_unit_nurse_only"
  CHECK (role = 'Nurse' OR "wardUnitId" IS NULL);
