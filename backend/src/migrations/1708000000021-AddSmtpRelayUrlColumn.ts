import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSmtpRelayUrlColumn1708000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The smtp_relay_url column was added to the CREATE TABLE IF NOT EXISTS statement,
    // but if the table already existed, the column was never actually created.
    const columns = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'outreach_email_accounts' AND column_name = 'smtp_relay_url'
    `);
    if (columns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "outreach_email_accounts"
        ADD COLUMN "smtp_relay_url" varchar
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outreach_email_accounts"
      DROP COLUMN IF EXISTS "smtp_relay_url"
    `);
  }
}
