import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "productions_texts" CASCADE;`)
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "productions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "productions_texts" ADD CONSTRAINT "productions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "productions_texts_order_parent" ON "productions_texts" USING btree ("order","parent_id");`)
}
