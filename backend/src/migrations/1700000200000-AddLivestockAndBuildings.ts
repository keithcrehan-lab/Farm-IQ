import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLivestockAndBuildings1700000200000 implements MigrationInterface {
  name = 'AddLivestockAndBuildings1700000200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "livestock_groups_species_enum" AS ENUM ('cattle', 'sheep')`,
    );
    await queryRunner.query(`
      CREATE TYPE "livestock_groups_category_enum" AS ENUM (
        'cow', 'bull', 'calf', 'weanling', 'replacement_heifer', 'finishing',
        'ewe', 'ram', 'lamb', 'hogget'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "livestock_groups" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "species" "livestock_groups_species_enum" NOT NULL,
        "category" "livestock_groups_category_enum" NOT NULL,
        "head_count" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_livestock_groups_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_livestock_groups_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_livestock_groups_farm_category" ON "livestock_groups" ("farm_id", "category")`,
    );

    await queryRunner.query(`
      CREATE TYPE "buildings_type_enum" AS ENUM ('slatted', 'calving', 'loose_housing', 'straw_bedded', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "buildings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "type" "buildings_type_enum" NOT NULL,
        "capacity_head" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_buildings_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_buildings_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_buildings_farm_id" ON "buildings" ("farm_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_buildings_farm_id"`);
    await queryRunner.query(`DROP TABLE "buildings"`);
    await queryRunner.query(`DROP TYPE "buildings_type_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_livestock_groups_farm_category"`);
    await queryRunner.query(`DROP TABLE "livestock_groups"`);
    await queryRunner.query(`DROP TYPE "livestock_groups_category_enum"`);
    await queryRunner.query(`DROP TYPE "livestock_groups_species_enum"`);
  }
}
