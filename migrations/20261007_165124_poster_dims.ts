import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "productions" ADD COLUMN "media_poster_width" numeric;
  ALTER TABLE "productions" ADD COLUMN "media_poster_height" numeric;`)
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "productions" DROP COLUMN "media_poster_width";
  ALTER TABLE "productions" DROP COLUMN "media_poster_height";`)
}
