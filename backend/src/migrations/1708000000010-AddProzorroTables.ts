import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProzorroTables1708000000010 implements MigrationInterface {
  name = 'AddProzorroTables1708000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prozorro_tenders" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "prozorro_id" varchar NOT NULL,
        "tender_number" varchar NOT NULL,
        "title" text NOT NULL DEFAULT '',
        "description" text,
        "status" varchar,
        "amount" decimal,
        "currency" varchar,
        "procuring_entity_name" varchar,
        "procuring_entity_id" varchar,
        "procurement_method_type" varchar,
        "raw_data" jsonb,
        "detail_fetched_at" TIMESTAMP,
        "tender_period_end" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_prozorro_tenders_prozorro_id" UNIQUE ("prozorro_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prozorro_tender_docs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tender_id" uuid NOT NULL REFERENCES "prozorro_tenders"("id") ON DELETE CASCADE,
        "document_id" varchar NOT NULL,
        "title" text NOT NULL DEFAULT '',
        "format" varchar,
        "url" text NOT NULL,
        "document_type" varchar,
        "parsed_text" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prozorro_ai_results" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tender_id" uuid NOT NULL REFERENCES "prozorro_tenders"("id") ON DELETE CASCADE,
        "search_query" text,
        "subject" text,
        "body" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_prozorro_ai_results_user_tender" UNIQUE ("user_id", "tender_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prozorro_web_results" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "search_query" varchar NOT NULL,
        "url" text NOT NULL,
        "title" text NOT NULL DEFAULT '',
        "snippet" text NOT NULL DEFAULT '',
        "favicon" varchar NOT NULL DEFAULT '',
        "parsed_emails" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_prozorro_web_results_user_url" UNIQUE ("user_id", "url")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prozorro_blacklist" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" varchar(320) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_prozorro_blacklist_user_email" UNIQUE ("user_id", "email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_prozorro_tenders_status"
      ON "prozorro_tenders" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_prozorro_tender_docs_tender"
      ON "prozorro_tender_docs" ("tender_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_prozorro_ai_results_user"
      ON "prozorro_ai_results" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_prozorro_web_results_user"
      ON "prozorro_web_results" ("user_id", "search_query")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_prozorro_blacklist_user"
      ON "prozorro_blacklist" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "prozorro_blacklist"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prozorro_web_results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prozorro_ai_results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prozorro_tender_docs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prozorro_tenders"`);
  }
}
