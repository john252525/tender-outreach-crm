import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestructureWebSearchAndAddEmails1708000000008
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create parsed_emails table
    await queryRunner.query(`
      CREATE TABLE "parsed_emails" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(320) NOT NULL UNIQUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 2. Create web_search_result_search_terms junction table
    await queryRunner.query(`
      CREATE TABLE "web_search_result_search_terms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "web_search_result_id" uuid NOT NULL REFERENCES "web_search_results"("id") ON DELETE CASCADE,
        "ai_search_term_id" uuid NOT NULL REFERENCES "ai_search_terms"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE("web_search_result_id", "ai_search_term_id")
      )
    `);

    // 3. Create web_search_result_emails junction table
    await queryRunner.query(`
      CREATE TABLE "web_search_result_emails" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "web_search_result_id" uuid NOT NULL REFERENCES "web_search_results"("id") ON DELETE CASCADE,
        "parsed_email_id" uuid NOT NULL REFERENCES "parsed_emails"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE("web_search_result_id", "parsed_email_id")
      )
    `);

    // 4. Migrate existing web_search_results data to junction table
    // Move searchTerm links to the junction table before dropping the column
    await queryRunner.query(`
      INSERT INTO "web_search_result_search_terms" ("web_search_result_id", "ai_search_term_id")
      SELECT "id", "ai_search_term_id"
      FROM "web_search_results"
      WHERE "ai_search_term_id" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // 5. Drop old columns from web_search_results
    await queryRunner.query(`
      ALTER TABLE "web_search_results" DROP COLUMN IF EXISTS "ai_search_term_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "web_search_results" DROP COLUMN IF EXISTS "query"
    `);

    // 6. Add unique constraint on (url, user_id) for web_search_results
    // First remove duplicate urls per user (keep newest)
    await queryRunner.query(`
      DELETE FROM "web_search_results" a
      USING "web_search_results" b
      WHERE a."url" = b."url"
        AND a."user_id" = b."user_id"
        AND a."created_at" < b."created_at"
    `);
    await queryRunner.query(`
      ALTER TABLE "web_search_results"
      ADD CONSTRAINT "UQ_web_search_results_url_user" UNIQUE ("url", "user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "web_search_results" DROP CONSTRAINT IF EXISTS "UQ_web_search_results_url_user"`);
    await queryRunner.query(`ALTER TABLE "web_search_results" ADD COLUMN "query" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "web_search_results" ADD COLUMN "ai_search_term_id" uuid REFERENCES "ai_search_terms"("id") ON DELETE CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "web_search_result_emails"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "web_search_result_search_terms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parsed_emails"`);
  }
}
