import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeysTable1708000000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "user_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "key_hash" varchar NOT NULL,
        "key_prefix" varchar(12) NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "last_used_at" timestamp NULL,
        "expires_at" timestamp NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id"),
        CONSTRAINT "FK_api_keys_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_api_keys_user" ON "api_keys" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_api_keys_key_prefix" ON "api_keys" ("key_prefix")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
  }
}
