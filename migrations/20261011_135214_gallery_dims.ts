import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "productions_media_gallery" ADD COLUMN "width" numeric;
  ALTER TABLE "productions_media_gallery" ADD COLUMN "height" numeric;`)
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "productions_media_gallery" DROP COLUMN "width";
  ALTER TABLE "productions_media_gallery" DROP COLUMN "height";`)
}
