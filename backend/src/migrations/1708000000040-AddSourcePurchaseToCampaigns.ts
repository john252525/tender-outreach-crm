import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddSourcePurchaseToCampaigns1708000000040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('outreach_campaigns', [
      new TableColumn({
        name: 'source_purchase_id',
        type: 'uuid',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'source_purchase_number',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    ]);

    await queryRunner.createForeignKey(
      'outreach_campaigns',
      new TableForeignKey({
        columnNames: ['source_purchase_id'],
        referencedTableName: 'purchases',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Backfill: campaigns created via the approve-to-outreach flow are named
    // "Тендер <purchase_number>". Match those to their purchases and fill in
    // the link so legacy campaigns get the same back-reference as new ones.
    await queryRunner.query(`
      UPDATE outreach_campaigns c
      SET source_purchase_id = p.id,
          source_purchase_number = p.purchase_number
      FROM purchases p
      WHERE c.source_purchase_id IS NULL
        AND c.name LIKE 'Тендер %'
        AND substring(c.name from 8) = p.purchase_number
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('outreach_campaigns');
    const fk = table!.foreignKeys.find((f) => f.columnNames.includes('source_purchase_id'));
    if (fk) await queryRunner.dropForeignKey('outreach_campaigns', fk);
    await queryRunner.dropColumn('outreach_campaigns', 'source_purchase_number');
    await queryRunner.dropColumn('outreach_campaigns', 'source_purchase_id');
  }
}
