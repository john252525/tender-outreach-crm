import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCryptoDealsTable1708000000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crypto_sources" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "user_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "PK_crypto_sources" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crypto_sources_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_crypto_sources_user" ON "crypto_sources" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_crypto_sources_slug" ON "crypto_sources" ("slug")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crypto_deals" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "source_id" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "sender_ip" varchar NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "PK_crypto_deals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_crypto_deals_source" FOREIGN KEY ("source_id") REFERENCES "crypto_sources"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_crypto_deals_source" ON "crypto_deals" ("source_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "crypto_deals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crypto_sources"`);
  }
}
