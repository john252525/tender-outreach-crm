import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailBlacklistAndMessages1708000000009
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_blacklist" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" varchar(320) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE("user_id", "email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "direction" varchar(10) NOT NULL,
        "contact_email" varchar(320) NOT NULL,
        "subject" text NOT NULL DEFAULT '',
        "body_text" text NOT NULL DEFAULT '',
        "body_html" text,
        "message_id" varchar,
        "in_reply_to" varchar,
        "purchase_id" uuid REFERENCES "purchases"("id") ON DELETE SET NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_email_messages_user_contact"
      ON "email_messages" ("user_id", "contact_email")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_email_blacklist_user"
      ON "email_blacklist" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_blacklist"`);
  }
}
