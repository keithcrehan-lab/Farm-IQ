import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfitability1700000300000 implements MigrationInterface {
  name = 'AddProfitability1700000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "enterprises" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "farms_farm_type_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enterprises_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_enterprises_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_enterprises_farm_id" ON "enterprises" ("farm_id")`);

    await queryRunner.query(`
      CREATE TYPE "transactions_category_enum" AS ENUM (
        'livestock_sales', 'milk', 'crops', 'contracting_income', 'subsidies', 'other_income',
        'fertiliser', 'feed', 'veterinary', 'seed', 'sprays', 'contracting_cost', 'fuel', 'bedding', 'transport', 'other_variable',
        'machinery', 'depreciation', 'insurance', 'electricity', 'finance', 'buildings', 'labour', 'professional_fees', 'other_fixed'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "enterprise_id" uuid,
        "field_id" uuid,
        "category" "transactions_category_enum" NOT NULL,
        "amount_eur" numeric(10,2) NOT NULL,
        "transaction_date" date NOT NULL,
        "description" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_enterprise" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_transactions_field" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_farm_date" ON "transactions" ("farm_id", "transaction_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_enterprise_id" ON "transactions" ("enterprise_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_field_id" ON "transactions" ("field_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_transactions_field_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_enterprise_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_farm_date"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transactions_category_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_enterprises_farm_id"`);
    await queryRunner.query(`DROP TABLE "enterprises"`);
  }
}
