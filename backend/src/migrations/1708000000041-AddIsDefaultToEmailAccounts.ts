import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsDefaultToEmailAccounts1708000000041 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'outreach_email_accounts',
      new TableColumn({
        name: 'is_default',
        type: 'boolean',
        default: false,
      }),
    );
    // No backfill: the single-active-account case is resolved dynamically at
    // campaign-creation time, so users with one account get auto-selection
    // without any default being persisted. Users with multiple accounts pick
    // their default explicitly via the UI.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('outreach_email_accounts', 'is_default');
  }
}
