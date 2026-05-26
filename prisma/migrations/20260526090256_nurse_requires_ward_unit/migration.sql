ALTER TABLE "Actor" ADD CONSTRAINT "Actor_nurse_requires_ward_unit"
CHECK (role != 'Nurse' OR "wardUnitId" IS NOT NULL);
