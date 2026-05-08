import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastActivityAtToFoundPurchase1708000000032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'found_purchases',
      new TableColumn({
        name: 'last_activity_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('found_purchases', 'last_activity_at');
  }
}
