import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSettings1708000000002 implements MigrationInterface {
  name = 'AddUserSettings1708000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "settings" jsonb DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "settings"
    `);
  }
}
