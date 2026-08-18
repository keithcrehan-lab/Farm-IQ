import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFertiliserProducts1700000100000 implements MigrationInterface {
  name = 'AddFertiliserProducts1700000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "fertiliser_products_category_enum" AS ENUM ('lime', 'phosphorus', 'potassium', 'nitrogen')
    `);
    await queryRunner.query(`
      CREATE TABLE "fertiliser_products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "category" "fertiliser_products_category_enum" NOT NULL,
        "nitrogen_pct" numeric(5,2) NOT NULL DEFAULT 0,
        "phosphorus_pct" numeric(5,2) NOT NULL DEFAULT 0,
        "potassium_pct" numeric(5,2) NOT NULL DEFAULT 0,
        "price_per_tonne_eur" numeric(8,2) NOT NULL,
        "is_default" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fertiliser_products_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_fertiliser_products_category" ON "fertiliser_products" ("category")`,
    );

    // Seed one default product per soil-driven nutrient category. Straight
    // (single-nutrient) products are used deliberately over an NPK compound so
    // the kg-of-nutrient -> tonnes-of-product conversion stays exact and
    // traceable, rather than guessing how a compound's N/P/K would be shared
    // across separate lime/P/K recommendations. No nitrogen product is seeded —
    // see FertiliserPlanService for why.
    await queryRunner.query(`
      INSERT INTO "fertiliser_products"
        ("name", "category", "nitrogen_pct", "phosphorus_pct", "potassium_pct", "price_per_tonne_eur", "is_default")
      VALUES
        ('Ground Lime', 'lime', 0, 0, 0, 32.00, true),
        ('Triple Superphosphate (0-20-0)', 'phosphorus', 0, 20, 0, 620.00, true),
        ('Muriate of Potash (0-0-50)', 'potassium', 0, 0, 50, 420.00, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_fertiliser_products_category"`);
    await queryRunner.query(`DROP TABLE "fertiliser_products"`);
    await queryRunner.query(`DROP TYPE "fertiliser_products_category_enum"`);
  }
}
