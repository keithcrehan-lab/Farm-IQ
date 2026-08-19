import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnimals1700000500000 implements MigrationInterface {
  name = 'AddAnimals1700000500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "animals_sex_enum" AS ENUM ('male', 'female')`);
    await queryRunner.query(`CREATE TYPE "animals_status_enum" AS ENUM ('active', 'sold', 'died')`);
    await queryRunner.query(`
      CREATE TABLE "animals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "tag_number" character varying NOT NULL,
        "species" "livestock_groups_species_enum" NOT NULL,
        "category" "livestock_groups_category_enum" NOT NULL,
        "breed" character varying,
        "sex" "animals_sex_enum" NOT NULL,
        "date_of_birth" date,
        "dam_tag_number" character varying,
        "sire_tag_number" character varying,
        "purchase_date" date,
        "purchase_price_eur" numeric(10,2),
        "target_weight_kg" numeric(6,1),
        "status" "animals_status_enum" NOT NULL DEFAULT 'active',
        "sale_date" date,
        "sale_weight_kg" numeric(6,1),
        "sale_price_eur" numeric(10,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_animals_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_animals_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_animals_farm_tag" ON "animals" ("farm_id", "tag_number")`,
    );

    await queryRunner.query(`
      CREATE TABLE "animal_weights" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "animal_id" uuid NOT NULL,
        "weigh_date" date NOT NULL,
        "weight_kg" numeric(6,1) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_animal_weights_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_animal_weights_animal" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_animal_weights_animal_date" ON "animal_weights" ("animal_id", "weigh_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_animal_weights_animal_date"`);
    await queryRunner.query(`DROP TABLE "animal_weights"`);
    await queryRunner.query(`DROP INDEX "IDX_animals_farm_tag"`);
    await queryRunner.query(`DROP TABLE "animals"`);
    await queryRunner.query(`DROP TYPE "animals_status_enum"`);
    await queryRunner.query(`DROP TYPE "animals_sex_enum"`);
  }
}
