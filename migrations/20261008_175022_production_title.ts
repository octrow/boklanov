import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "productions_locales" ADD COLUMN "title" varchar;
  UPDATE "productions_locales" SET "title" = "identity_title";`)
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "productions_locales" DROP COLUMN "title";`)
}
