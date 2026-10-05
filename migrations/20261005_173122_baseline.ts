import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ru', 'en', 'de');
  CREATE TYPE "public"."enum_productions_media_videos_provider" AS ENUM('youtube', 'vimeo');
  CREATE TYPE "public"."enum_productions_taxonomy_role" AS ENUM('director', 'co-director', 'performer', 'art-director', 'playwright', 'producer');
  CREATE TYPE "public"."enum_productions_production_theatre_country" AS ENUM('AT', 'BY', 'GB', 'DE', 'ES', 'IT', 'KZ', 'KG', 'LV', 'LT', 'LU', 'NL', 'PL', 'PT', 'RU', 'UZ', 'UA', 'FI', 'FR', 'CZ', 'CH', 'EE');
  CREATE TYPE "public"."enum_productions_status" AS ENUM('live', 'in-development', 'archived', 'on-tour');
  CREATE TABLE "productions_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src" varchar,
  	"credit" varchar
  );
  
  CREATE TABLE "productions_media_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions_media_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"provider" "enum_productions_media_videos_provider" DEFAULT 'youtube'
  );
  
  CREATE TABLE "productions_taxonomy_role" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_productions_taxonomy_role",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
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
  
  CREATE TABLE "productions_team_credits_ru" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "productions_team_credits_en" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "productions_team_credits_de" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "productions_recognition_awards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"url" varchar
  );
  
  CREATE TABLE "productions_recognition_awards_locales" (
  	"name" varchar,
  	"category" varchar,
  	"city" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions_recognition_festivals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" numeric
  );
  
  CREATE TABLE "productions_recognition_festivals_locales" (
  	"name" varchar,
  	"category" varchar,
  	"city" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions_recognition_press" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"outlet" varchar,
  	"language" varchar
  );
  
  CREATE TABLE "productions_recognition_press_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions_recognition_external_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "productions_recognition_external_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions_history_tour" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "productions_history_tour_locales" (
  	"city" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions_history_runs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year_from" numeric,
  	"year_to" numeric
  );
  
  CREATE TABLE "productions_history_runs_locales" (
  	"venue" varchar,
  	"city" varchar,
  	"count" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "productions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"media_poster_src" varchar,
  	"media_poster_credit" varchar,
  	"media_productions_photo_src" varchar,
  	"media_productions_photo_credit" varchar,
  	"media_featured_photo_src" varchar,
  	"media_featured_photo_credit" varchar,
  	"production_age_rating" varchar,
  	"production_tickets_url" varchar,
  	"production_year" numeric,
  	"production_duration_min" numeric,
  	"production_theatre_country" "enum_productions_production_theatre_country",
  	"production_theatre_url" varchar,
  	"production_theatre_year" numeric,
  	"status" "enum_productions_status" DEFAULT 'live',
  	"settings_booking_cta" boolean DEFAULT true,
  	"settings_booking_cta_url" varchar,
  	"settings_featured" boolean,
  	"settings_featured_order" numeric,
  	"settings_list_order" numeric,
  	"settings_tech_rider" varchar,
  	"settings_press_kit" varchar,
  	"settings_notion_ids_ru" varchar,
  	"settings_notion_ids_en" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "productions_locales" (
  	"identity_title" varchar NOT NULL,
  	"identity_body" jsonb,
  	"identity_tagline" jsonb,
  	"identity_synopsis" jsonb,
  	"identity_directors_note" jsonb,
  	"production_premiere_date" varchar,
  	"production_theatre_name" varchar,
  	"production_theatre_short_name" varchar,
  	"production_theatre_city" varchar,
  	"settings_booking_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"prefix" varchar DEFAULT 'productions',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_w420_url" varchar,
  	"sizes_w420_width" numeric,
  	"sizes_w420_height" numeric,
  	"sizes_w420_mime_type" varchar,
  	"sizes_w420_filesize" numeric,
  	"sizes_w420_filename" varchar,
  	"sizes_w600_url" varchar,
  	"sizes_w600_width" numeric,
  	"sizes_w600_height" numeric,
  	"sizes_w600_mime_type" varchar,
  	"sizes_w600_filesize" numeric,
  	"sizes_w600_filename" varchar,
  	"sizes_w720_url" varchar,
  	"sizes_w720_width" numeric,
  	"sizes_w720_height" numeric,
  	"sizes_w720_mime_type" varchar,
  	"sizes_w720_filesize" numeric,
  	"sizes_w720_filename" varchar,
  	"sizes_w828_url" varchar,
  	"sizes_w828_width" numeric,
  	"sizes_w828_height" numeric,
  	"sizes_w828_mime_type" varchar,
  	"sizes_w828_filesize" numeric,
  	"sizes_w828_filename" varchar,
  	"sizes_w1080_url" varchar,
  	"sizes_w1080_width" numeric,
  	"sizes_w1080_height" numeric,
  	"sizes_w1080_mime_type" varchar,
  	"sizes_w1080_filesize" numeric,
  	"sizes_w1080_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"productions_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "about_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src" varchar,
  	"credit" varchar
  );
  
  CREATE TABLE "about_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" numeric
  );
  
  CREATE TABLE "about_milestones_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_lineage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar
  );
  
  CREATE TABLE "about_lineage_locales" (
  	"name" varchar,
  	"role" varchar,
  	"institution" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_marginalia" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "about_marginalia_locales" (
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"portrait_src" varchar,
  	"portrait_credit" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_locales" (
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "contact" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"telegram_url" varchar,
  	"instagram_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_locales" (
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "productions_media_gallery" ADD CONSTRAINT "productions_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_media_gallery_locales" ADD CONSTRAINT "productions_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_media_videos" ADD CONSTRAINT "productions_media_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_role" ADD CONSTRAINT "productions_taxonomy_role_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_form" ADD CONSTRAINT "productions_taxonomy_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_lineage" ADD CONSTRAINT "productions_taxonomy_lineage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_taxonomy_tags" ADD CONSTRAINT "productions_taxonomy_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_team_credits_ru" ADD CONSTRAINT "productions_team_credits_ru_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_team_credits_en" ADD CONSTRAINT "productions_team_credits_en_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_team_credits_de" ADD CONSTRAINT "productions_team_credits_de_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_awards" ADD CONSTRAINT "productions_recognition_awards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_awards_locales" ADD CONSTRAINT "productions_recognition_awards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_recognition_awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_festivals" ADD CONSTRAINT "productions_recognition_festivals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_festivals_locales" ADD CONSTRAINT "productions_recognition_festivals_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_recognition_festivals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_press" ADD CONSTRAINT "productions_recognition_press_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_press_locales" ADD CONSTRAINT "productions_recognition_press_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_recognition_press"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_external_links" ADD CONSTRAINT "productions_recognition_external_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_recognition_external_links_locales" ADD CONSTRAINT "productions_recognition_external_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_recognition_external_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_history_tour" ADD CONSTRAINT "productions_history_tour_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_history_tour_locales" ADD CONSTRAINT "productions_history_tour_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_history_tour"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_history_runs" ADD CONSTRAINT "productions_history_runs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_history_runs_locales" ADD CONSTRAINT "productions_history_runs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions_history_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_locales" ADD CONSTRAINT "productions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_productions_fk" FOREIGN KEY ("productions_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_photos" ADD CONSTRAINT "about_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_milestones" ADD CONSTRAINT "about_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_milestones_locales" ADD CONSTRAINT "about_milestones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_lineage" ADD CONSTRAINT "about_lineage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_lineage_locales" ADD CONSTRAINT "about_lineage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_lineage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_marginalia" ADD CONSTRAINT "about_marginalia_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_marginalia_locales" ADD CONSTRAINT "about_marginalia_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_marginalia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_locales" ADD CONSTRAINT "about_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_locales" ADD CONSTRAINT "contact_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "productions_media_gallery_order_idx" ON "productions_media_gallery" USING btree ("_order");
  CREATE INDEX "productions_media_gallery_parent_id_idx" ON "productions_media_gallery" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_media_gallery_locales_locale_parent_id_unique" ON "productions_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "productions_media_videos_order_idx" ON "productions_media_videos" USING btree ("_order");
  CREATE INDEX "productions_media_videos_parent_id_idx" ON "productions_media_videos" USING btree ("_parent_id");
  CREATE INDEX "productions_taxonomy_role_order_idx" ON "productions_taxonomy_role" USING btree ("order");
  CREATE INDEX "productions_taxonomy_role_parent_idx" ON "productions_taxonomy_role" USING btree ("parent_id");
  CREATE INDEX "productions_taxonomy_form_order_idx" ON "productions_taxonomy_form" USING btree ("_order");
  CREATE INDEX "productions_taxonomy_form_parent_id_idx" ON "productions_taxonomy_form" USING btree ("_parent_id");
  CREATE INDEX "productions_taxonomy_lineage_order_idx" ON "productions_taxonomy_lineage" USING btree ("_order");
  CREATE INDEX "productions_taxonomy_lineage_parent_id_idx" ON "productions_taxonomy_lineage" USING btree ("_parent_id");
  CREATE INDEX "productions_taxonomy_tags_order_idx" ON "productions_taxonomy_tags" USING btree ("_order");
  CREATE INDEX "productions_taxonomy_tags_parent_id_idx" ON "productions_taxonomy_tags" USING btree ("_parent_id");
  CREATE INDEX "productions_team_credits_ru_order_idx" ON "productions_team_credits_ru" USING btree ("_order");
  CREATE INDEX "productions_team_credits_ru_parent_id_idx" ON "productions_team_credits_ru" USING btree ("_parent_id");
  CREATE INDEX "productions_team_credits_en_order_idx" ON "productions_team_credits_en" USING btree ("_order");
  CREATE INDEX "productions_team_credits_en_parent_id_idx" ON "productions_team_credits_en" USING btree ("_parent_id");
  CREATE INDEX "productions_team_credits_de_order_idx" ON "productions_team_credits_de" USING btree ("_order");
  CREATE INDEX "productions_team_credits_de_parent_id_idx" ON "productions_team_credits_de" USING btree ("_parent_id");
  CREATE INDEX "productions_recognition_awards_order_idx" ON "productions_recognition_awards" USING btree ("_order");
  CREATE INDEX "productions_recognition_awards_parent_id_idx" ON "productions_recognition_awards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_recognition_awards_locales_locale_parent_id_uniq" ON "productions_recognition_awards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "productions_recognition_festivals_order_idx" ON "productions_recognition_festivals" USING btree ("_order");
  CREATE INDEX "productions_recognition_festivals_parent_id_idx" ON "productions_recognition_festivals" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_recognition_festivals_locales_locale_parent_id_u" ON "productions_recognition_festivals_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "productions_recognition_press_order_idx" ON "productions_recognition_press" USING btree ("_order");
  CREATE INDEX "productions_recognition_press_parent_id_idx" ON "productions_recognition_press" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_recognition_press_locales_locale_parent_id_uniqu" ON "productions_recognition_press_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "productions_recognition_external_links_order_idx" ON "productions_recognition_external_links" USING btree ("_order");
  CREATE INDEX "productions_recognition_external_links_parent_id_idx" ON "productions_recognition_external_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_recognition_external_links_locales_locale_parent" ON "productions_recognition_external_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "productions_history_tour_order_idx" ON "productions_history_tour" USING btree ("_order");
  CREATE INDEX "productions_history_tour_parent_id_idx" ON "productions_history_tour" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_history_tour_locales_locale_parent_id_unique" ON "productions_history_tour_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "productions_history_runs_order_idx" ON "productions_history_runs" USING btree ("_order");
  CREATE INDEX "productions_history_runs_parent_id_idx" ON "productions_history_runs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "productions_history_runs_locales_locale_parent_id_unique" ON "productions_history_runs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "productions_slug_idx" ON "productions" USING btree ("slug");
  CREATE INDEX "productions_production_production_year_idx" ON "productions" USING btree ("production_year");
  CREATE INDEX "productions_updated_at_idx" ON "productions" USING btree ("updated_at");
  CREATE INDEX "productions_created_at_idx" ON "productions" USING btree ("created_at");
  CREATE UNIQUE INDEX "productions_locales_locale_parent_id_unique" ON "productions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_w420_sizes_w420_filename_idx" ON "media" USING btree ("sizes_w420_filename");
  CREATE INDEX "media_sizes_w600_sizes_w600_filename_idx" ON "media" USING btree ("sizes_w600_filename");
  CREATE INDEX "media_sizes_w720_sizes_w720_filename_idx" ON "media" USING btree ("sizes_w720_filename");
  CREATE INDEX "media_sizes_w828_sizes_w828_filename_idx" ON "media" USING btree ("sizes_w828_filename");
  CREATE INDEX "media_sizes_w1080_sizes_w1080_filename_idx" ON "media" USING btree ("sizes_w1080_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_productions_id_idx" ON "payload_locked_documents_rels" USING btree ("productions_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "about_photos_order_idx" ON "about_photos" USING btree ("_order");
  CREATE INDEX "about_photos_parent_id_idx" ON "about_photos" USING btree ("_parent_id");
  CREATE INDEX "about_milestones_order_idx" ON "about_milestones" USING btree ("_order");
  CREATE INDEX "about_milestones_parent_id_idx" ON "about_milestones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_milestones_locales_locale_parent_id_unique" ON "about_milestones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_lineage_order_idx" ON "about_lineage" USING btree ("_order");
  CREATE INDEX "about_lineage_parent_id_idx" ON "about_lineage" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_lineage_locales_locale_parent_id_unique" ON "about_lineage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_marginalia_order_idx" ON "about_marginalia" USING btree ("_order");
  CREATE INDEX "about_marginalia_parent_id_idx" ON "about_marginalia" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_marginalia_locales_locale_parent_id_unique" ON "about_marginalia_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "about_locales_locale_parent_id_unique" ON "about_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "contact_locales_locale_parent_id_unique" ON "contact_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "productions_media_gallery" CASCADE;
  DROP TABLE "productions_media_gallery_locales" CASCADE;
  DROP TABLE "productions_media_videos" CASCADE;
  DROP TABLE "productions_taxonomy_role" CASCADE;
  DROP TABLE "productions_taxonomy_form" CASCADE;
  DROP TABLE "productions_taxonomy_lineage" CASCADE;
  DROP TABLE "productions_taxonomy_tags" CASCADE;
  DROP TABLE "productions_team_credits_ru" CASCADE;
  DROP TABLE "productions_team_credits_en" CASCADE;
  DROP TABLE "productions_team_credits_de" CASCADE;
  DROP TABLE "productions_recognition_awards" CASCADE;
  DROP TABLE "productions_recognition_awards_locales" CASCADE;
  DROP TABLE "productions_recognition_festivals" CASCADE;
  DROP TABLE "productions_recognition_festivals_locales" CASCADE;
  DROP TABLE "productions_recognition_press" CASCADE;
  DROP TABLE "productions_recognition_press_locales" CASCADE;
  DROP TABLE "productions_recognition_external_links" CASCADE;
  DROP TABLE "productions_recognition_external_links_locales" CASCADE;
  DROP TABLE "productions_history_tour" CASCADE;
  DROP TABLE "productions_history_tour_locales" CASCADE;
  DROP TABLE "productions_history_runs" CASCADE;
  DROP TABLE "productions_history_runs_locales" CASCADE;
  DROP TABLE "productions" CASCADE;
  DROP TABLE "productions_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "about_photos" CASCADE;
  DROP TABLE "about_milestones" CASCADE;
  DROP TABLE "about_milestones_locales" CASCADE;
  DROP TABLE "about_lineage" CASCADE;
  DROP TABLE "about_lineage_locales" CASCADE;
  DROP TABLE "about_marginalia" CASCADE;
  DROP TABLE "about_marginalia_locales" CASCADE;
  DROP TABLE "about" CASCADE;
  DROP TABLE "about_locales" CASCADE;
  DROP TABLE "contact" CASCADE;
  DROP TABLE "contact_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_productions_media_videos_provider";
  DROP TYPE "public"."enum_productions_taxonomy_role";
  DROP TYPE "public"."enum_productions_production_theatre_country";
  DROP TYPE "public"."enum_productions_status";`)
}
