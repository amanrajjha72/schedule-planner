export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE goals ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE commitments ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ALTER TABLE schedules ALTER COLUMN id SET DEFAULT gen_random_uuid();
  `);
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE schedules ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE commitments ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE goals ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
  `);
}