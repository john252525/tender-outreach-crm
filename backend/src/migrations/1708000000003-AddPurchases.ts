import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchases1708000000003 implements MigrationInterface {
  name = 'AddPurchases1708000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "purchase_number" character varying NOT NULL,
        "object_info" text,
        "max_price" decimal(15,2),
        "currency_code" character varying(10),
        "purchase_type" character varying(100),
        "stage" integer,
        "region" integer,
        "published_at" TIMESTAMP,
        "updated_at_external" TIMESTAMP,
        "customers" jsonb,
        "owners" jsonb,
        "raw_list_data" jsonb,
        "raw_detail_data" jsonb,
        "detail_fetched_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchases_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchases_purchase_number" UNIQUE ("purchase_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_purchases_purchase_number" ON "purchases" ("purchase_number")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "purchase_id" uuid NOT NULL,
        "published_content_id" character varying NOT NULL,
        "file_name" character varying,
        "file_size" integer,
        "doc_description" text,
        "doc_date" TIMESTAMP,
        "url" text NOT NULL,
        "doc_kind_code" character varying(20),
        "doc_kind_name" character varying,
        "doc_type" character varying(100),
        "is_downloaded" boolean NOT NULL DEFAULT false,
        "local_path" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_files_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchase_files_purchase_id" FOREIGN KEY ("purchase_id")
          REFERENCES "purchases"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_purchase_files_purchase_id" ON "purchase_files" ("purchase_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_purchase_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "purchase_id" uuid NOT NULL,
        "search_query" text,
        "found_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_purchase_history_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_purchase_history_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_purchase_history_purchase_id" FOREIGN KEY ("purchase_id")
          REFERENCES "purchases"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_purchase_history_user_id" ON "user_purchase_history" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_purchase_history_purchase_id" ON "user_purchase_history" ("purchase_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_purchase_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchases"`);
  }
}
