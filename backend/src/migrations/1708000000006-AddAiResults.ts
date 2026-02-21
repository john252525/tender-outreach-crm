import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiResults1708000000006 implements MigrationInterface {
  name = 'AddAiResults1708000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // AI search terms - unique search phrases
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_search_terms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "term" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_search_terms_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_search_terms_term" UNIQUE ("term")
      )
    `);

    // AI results per user+purchase (subject, body)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_ai_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "purchase_id" uuid NOT NULL,
        "ai_search_term_id" uuid,
        "subject" text,
        "body" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_ai_results_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchase_ai_results_user_purchase" UNIQUE ("user_id", "purchase_id"),
        CONSTRAINT "FK_purchase_ai_results_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_purchase_ai_results_purchase_id" FOREIGN KEY ("purchase_id")
          REFERENCES "purchases"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_purchase_ai_results_search_term_id" FOREIGN KEY ("ai_search_term_id")
          REFERENCES "ai_search_terms"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_ai_results_user_id" ON "purchase_ai_results" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_ai_results_purchase_id" ON "purchase_ai_results" ("purchase_id")
    `);

    // Junction: ai_search_terms <-> purchases (per user)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_search_term_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ai_search_term_id" uuid NOT NULL,
        "purchase_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_search_term_purchases_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_search_term_purchases" UNIQUE ("ai_search_term_id", "purchase_id", "user_id"),
        CONSTRAINT "FK_ai_stp_search_term_id" FOREIGN KEY ("ai_search_term_id")
          REFERENCES "ai_search_terms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_stp_purchase_id" FOREIGN KEY ("purchase_id")
          REFERENCES "purchases"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_stp_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_stp_search_term_id" ON "ai_search_term_purchases" ("ai_search_term_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ai_stp_purchase_id" ON "ai_search_term_purchases" ("purchase_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_search_term_purchases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_ai_results"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_search_terms"`);
  }
}
