import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParsedTextToFiles1708000000005 implements MigrationInterface {
  name = 'AddParsedTextToFiles1708000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "purchase_files"
      ADD COLUMN IF NOT EXISTS "parsed_text" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "purchase_files"
      DROP COLUMN IF EXISTS "parsed_text"
    `);
  }
}
