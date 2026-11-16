import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "productions_media_gallery_locales_parent_id_idx" ON "productions_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_recognition_awards_locales_parent_id_idx" ON "productions_recognition_awards_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_recognition_festivals_locales_parent_id_idx" ON "productions_recognition_festivals_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_recognition_press_locales_parent_id_idx" ON "productions_recognition_press_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_recognition_external_links_locales_parent_id_idx" ON "productions_recognition_external_links_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_history_tour_locales_parent_id_idx" ON "productions_history_tour_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_history_runs_locales_parent_id_idx" ON "productions_history_runs_locales" USING btree ("_parent_id");
  CREATE INDEX "productions_locales_parent_id_idx" ON "productions_locales" USING btree ("_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "about_milestones_locales_parent_id_idx" ON "about_milestones_locales" USING btree ("_parent_id");
  CREATE INDEX "about_lineage_locales_parent_id_idx" ON "about_lineage_locales" USING btree ("_parent_id");
  CREATE INDEX "about_marginalia_locales_parent_id_idx" ON "about_marginalia_locales" USING btree ("_parent_id");
  CREATE INDEX "about_locales_parent_id_idx" ON "about_locales" USING btree ("_parent_id");
  CREATE INDEX "contact_locales_parent_id_idx" ON "contact_locales" USING btree ("_parent_id");`)
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "productions_media_gallery_locales_parent_id_idx";
  DROP INDEX "productions_recognition_awards_locales_parent_id_idx";
  DROP INDEX "productions_recognition_festivals_locales_parent_id_idx";
  DROP INDEX "productions_recognition_press_locales_parent_id_idx";
  DROP INDEX "productions_recognition_external_links_locales_parent_id_idx";
  DROP INDEX "productions_history_tour_locales_parent_id_idx";
  DROP INDEX "productions_history_runs_locales_parent_id_idx";
  DROP INDEX "productions_locales_parent_id_idx";
  DROP INDEX "media_locales_parent_id_idx";
  DROP INDEX "about_milestones_locales_parent_id_idx";
  DROP INDEX "about_lineage_locales_parent_id_idx";
  DROP INDEX "about_marginalia_locales_parent_id_idx";
  DROP INDEX "about_locales_parent_id_idx";
  DROP INDEX "contact_locales_parent_id_idx";`)
}
