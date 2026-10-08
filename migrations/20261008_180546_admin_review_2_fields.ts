import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Admin review №2, closed lists instead of free text:
 *   - taxonomy.form / .lineage: array<{ value }> → hasMany select
 *   - taxonomy.tags: array<{ value }> → hasMany text (productions_texts)
 *   - production.ageRating, recognition.press[].language: text → select
 * Plus production.year backfilled from the RU premiere date where blank.
 *
 * Hand-written: the generated diff dropped the tags table and added NOT
 * NULL columns to filled tables. Rows are copied, not recreated by hand.
 * Values outside the new lists abort the migration before any change.
 */

const FORMS = [
  'theater',
  'ensemble',
  'solo',
  'puppet',
  'family',
  'reading',
  'collage',
  'festival'
]
const LINEAGES = ['btk', 'kudashov', 'rgisi']
const LANGUAGES = [
  'ru',
  'en',
  'de',
  'fi',
  'et',
  'lv',
  'lt',
  'pl',
  'cs',
  'fr',
  'it',
  'es',
  'uk',
  'kk'
]
const AGES = ['0+', '3+', '4+', '5+', '6+', '12+', '14+', '16+', '18+']

type Row = { v: string }

async function assertKnown(
  db: MigrateUpArgs['db'],
  query: ReturnType<typeof sql>,
  allowed: string[],
  what: string
): Promise<void> {
  const res = (await db.execute(query)) as unknown as { rows: Row[] }
  const unknown = res.rows.map((r) => r.v).filter((v) => !allowed.includes(v))
  if (unknown.length) {
    throw new Error(
      `${what}: values outside the new list: ${unknown.join(', ')}`
    )
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // The one free-text form in the data; the site's slug is `collage`.
  await db.execute(sql`
    UPDATE "productions_taxonomy_form" SET "value" = 'collage' WHERE "value" = 'коллаж';
    UPDATE "productions_taxonomy_form" SET "value" = NULL WHERE trim("value") = '';
    UPDATE "productions_taxonomy_lineage" SET "value" = NULL WHERE trim("value") = '';
    UPDATE "productions_recognition_press" SET "language" = NULL WHERE trim("language") = '';
    UPDATE "productions" SET "production_age_rating" = NULL WHERE trim("production_age_rating") = '';
  `)
  await assertKnown(
    db,
    sql`SELECT DISTINCT "value" v FROM "productions_taxonomy_form" WHERE "value" IS NOT NULL`,
    FORMS,
    'taxonomy.form'
  )
  await assertKnown(
    db,
    sql`SELECT DISTINCT "value" v FROM "productions_taxonomy_lineage" WHERE "value" IS NOT NULL`,
    LINEAGES,
    'taxonomy.lineage'
  )
  await assertKnown(
    db,
    sql`SELECT DISTINCT "language" v FROM "productions_recognition_press" WHERE "language" IS NOT NULL`,
    LANGUAGES,
    'press.language'
  )
  await assertKnown(
    db,
    sql`SELECT DISTINCT "production_age_rating" v FROM "productions" WHERE "production_age_rating" IS NOT NULL`,
    AGES,
    'production.ageRating'
  )

  await db.execute(sql`
  CREATE TYPE "public"."enum_productions_taxonomy_form" AS ENUM('theater', 'ensemble', 'solo', 'puppet', 'family', 'reading', 'collage', 'festival');
  CREATE TYPE "public"."enum_productions_taxonomy_lineage" AS ENUM('btk', 'kudashov', 'rgisi');
  CREATE TYPE "public"."enum_productions_recognition_press_language" AS ENUM('ru', 'en', 'de', 'fi', 'et', 'lv', 'lt', 'pl', 'cs', 'fr', 'it', 'es', 'uk', 'kk');
  CREATE TYPE "public"."enum_productions_production_age_rating" AS ENUM('0+', '3+', '4+', '5+', '6+', '12+', '14+', '16+', '18+');

  ALTER TABLE "productions_recognition_press" ALTER COLUMN "language" SET DATA TYPE "public"."enum_productions_recognition_press_language" USING "language"::"public"."enum_productions_recognition_press_language";
  ALTER TABLE "productions" ALTER COLUMN "production_age_rating" SET DATA TYPE "public"."enum_productions_production_age_rating" USING "production_age_rating"::"public"."enum_productions_production_age_rating";

  ALTER TABLE "productions_taxonomy_form" RENAME TO "_old_taxonomy_form";
  ALTER TABLE "productions_taxonomy_lineage" RENAME TO "_old_taxonomy_lineage";
  DROP INDEX "productions_taxonomy_form_order_idx";
  DROP INDEX "productions_taxonomy_form_parent_id_idx";
  DROP INDEX "productions_taxonomy_lineage_order_idx";
  DROP INDEX "productions_taxonomy_lineage_parent_id_idx";

  CREATE TABLE "productions_taxonomy_form" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "public"."enum_productions_taxonomy_form",
  	"id" serial PRIMARY KEY NOT NULL
  );
  CREATE TABLE "productions_taxonomy_lineage" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "public"."enum_productions_taxonomy_lineage",
  	"id" serial PRIMARY KEY NOT NULL
  );
  CREATE TABLE "productions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );

  INSERT INTO "productions_taxonomy_form" ("order", "parent_id", "value")
    SELECT "_order", "_parent_id", "value"::"public"."enum_productions_taxonomy_form"
    FROM "_old_taxonomy_form" WHERE "value" IS NOT NULL;
  INSERT INTO "productions_taxonomy_lineage" ("order", "parent_id", "value")
    SELECT "_order", "_parent_id", "value"::"public"."enum_productions_taxonomy_lineage"
    FROM "_old_taxonomy_lineage" WHERE "value" IS NOT NULL;
  INSERT INTO "productions_texts" ("order", "parent_id", "path", "text")
    SELECT "_order", "_parent_id", 'taxonomy.tags', "value"
    FROM "productions_taxonomy_tags" WHERE trim(coalesce("value", '')) <> '';

  DROP TABLE "_old_taxonomy_form" CASCADE;
  DROP TABLE "_old_taxonomy_lineage" CASCADE;
  DROP TABLE "productions_taxonomy_tags" CASCADE;

  ALTER TABLE "productions_taxonomy_form" ADD CONSTRAINT "productions_taxonomy_form_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_lineage" ADD CONSTRAINT "productions_taxonomy_lineage_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_texts" ADD CONSTRAINT "productions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "productions_taxonomy_form_order_idx" ON "productions_taxonomy_form" USING btree ("order");
  CREATE INDEX "productions_taxonomy_form_parent_idx" ON "productions_taxonomy_form" USING btree ("parent_id");
  CREATE INDEX "productions_taxonomy_lineage_order_idx" ON "productions_taxonomy_lineage" USING btree ("order");
  CREATE INDEX "productions_taxonomy_lineage_parent_idx" ON "productions_taxonomy_lineage" USING btree ("parent_id");
  CREATE INDEX "productions_texts_order_parent" ON "productions_texts" USING btree ("order","parent_id");

  UPDATE "productions" p
    SET "production_year" = substring(l."production_premiere_date" from '(?:19|20)[0-9]{2}')::numeric
    FROM "productions_locales" l
    WHERE l."_parent_id" = p."id" AND l."_locale" = 'ru'
      AND p."production_year" IS NULL
      AND l."production_premiere_date" ~ '(19|20)[0-9]{2}';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Back to array<{ value }> rows; the backfilled years stay (real data).
  await db.execute(sql`
  ALTER TABLE "productions_taxonomy_form" RENAME TO "_new_taxonomy_form";
  ALTER TABLE "productions_taxonomy_lineage" RENAME TO "_new_taxonomy_lineage";
  DROP INDEX "productions_taxonomy_form_order_idx";
  DROP INDEX "productions_taxonomy_form_parent_idx";
  DROP INDEX "productions_taxonomy_lineage_order_idx";
  DROP INDEX "productions_taxonomy_lineage_parent_idx";

  CREATE TABLE "productions_taxonomy_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  CREATE TABLE "productions_taxonomy_lineage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  CREATE TABLE "productions_taxonomy_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );

  INSERT INTO "productions_taxonomy_form" SELECT "order", "parent_id", md5(random()::text), "value"::text FROM "_new_taxonomy_form";
  INSERT INTO "productions_taxonomy_lineage" SELECT "order", "parent_id", md5(random()::text), "value"::text FROM "_new_taxonomy_lineage";
  INSERT INTO "productions_taxonomy_tags" SELECT "order", "parent_id", md5(random()::text), "text" FROM "productions_texts" WHERE "path" = 'taxonomy.tags';

  DROP TABLE "_new_taxonomy_form" CASCADE;
  DROP TABLE "_new_taxonomy_lineage" CASCADE;
  DROP TABLE "productions_texts" CASCADE;

  ALTER TABLE "productions_taxonomy_form" ADD CONSTRAINT "productions_taxonomy_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_lineage" ADD CONSTRAINT "productions_taxonomy_lineage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_tags" ADD CONSTRAINT "productions_taxonomy_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "productions_taxonomy_form_order_idx" ON "productions_taxonomy_form" USING btree ("_order");
  CREATE INDEX "productions_taxonomy_form_parent_id_idx" ON "productions_taxonomy_form" USING btree ("_parent_id");
  CREATE INDEX "productions_taxonomy_lineage_order_idx" ON "productions_taxonomy_lineage" USING btree ("_order");
  CREATE INDEX "productions_taxonomy_lineage_parent_id_idx" ON "productions_taxonomy_lineage" USING btree ("_parent_id");
  CREATE INDEX "productions_taxonomy_tags_order_idx" ON "productions_taxonomy_tags" USING btree ("_order");
  CREATE INDEX "productions_taxonomy_tags_parent_id_idx" ON "productions_taxonomy_tags" USING btree ("_parent_id");

  ALTER TABLE "productions_recognition_press" ALTER COLUMN "language" SET DATA TYPE varchar;
  ALTER TABLE "productions" ALTER COLUMN "production_age_rating" SET DATA TYPE varchar;
  DROP TYPE "public"."enum_productions_taxonomy_form";
  DROP TYPE "public"."enum_productions_taxonomy_lineage";
  DROP TYPE "public"."enum_productions_recognition_press_language";
  DROP TYPE "public"."enum_productions_production_age_rating";`)
}
