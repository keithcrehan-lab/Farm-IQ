import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "full_name" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "farms_farm_type_enum" AS ENUM ('suckler', 'dairy', 'sheep', 'tillage', 'mixed', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "farms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "county" character varying,
        "herd_number" character varying,
        "farm_type" "farms_farm_type_enum" NOT NULL DEFAULT 'mixed',
        "owner_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_farms_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_farms_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_farms_owner_id" ON "farms" ("owner_id")`);

    await queryRunner.query(`
      CREATE TYPE "fields_soil_type_enum" AS ENUM ('mineral', 'peat', 'gley', 'unknown')
    `);
    await queryRunner.query(`
      CREATE TYPE "fields_land_use_enum" AS ENUM ('grazing', 'silage', 'tillage', 'rough_grazing', 'other')
    `);
    await queryRunner.query(`
      CREATE TABLE "fields" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "boundary" geometry(Polygon,4326) NOT NULL,
        "area_ha" numeric(8,3) NOT NULL,
        "soil_type" "fields_soil_type_enum" NOT NULL DEFAULT 'unknown',
        "land_use" "fields_land_use_enum" NOT NULL DEFAULT 'grazing',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fields_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fields_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_fields_farm_id" ON "fields" ("farm_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_fields_boundary" ON "fields" USING GIST ("boundary")`,
    );

    await queryRunner.query(`
      CREATE TABLE "soil_tests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "field_id" uuid NOT NULL,
        "sample_date" date NOT NULL,
        "lab_name" character varying,
        "ph" numeric(3,1) NOT NULL,
        "p_index" integer NOT NULL,
        "k_index" integer NOT NULL,
        "mg_index" integer,
        "organic_matter_pct" numeric(4,1),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_soil_tests_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_soil_tests_field" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_soil_tests_field_id" ON "soil_tests" ("field_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "soil_tests"`);
    await queryRunner.query(`DROP INDEX "IDX_fields_boundary"`);
    await queryRunner.query(`DROP INDEX "IDX_fields_farm_id"`);
    await queryRunner.query(`DROP TABLE "fields"`);
    await queryRunner.query(`DROP TYPE "fields_land_use_enum"`);
    await queryRunner.query(`DROP TYPE "fields_soil_type_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_farms_owner_id"`);
    await queryRunner.query(`DROP TABLE "farms"`);
    await queryRunner.query(`DROP TYPE "farms_farm_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
