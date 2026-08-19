import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupBuy1700000400000 implements MigrationInterface {
  name = 'AddGroupBuy1700000400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "group_buy_offers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_name" character varying NOT NULL,
        "fertiliser_product_category" "fertiliser_products_category_enum",
        "county" character varying,
        "typical_price_per_tonne_eur" numeric(8,2) NOT NULL,
        "negotiated_price_per_tonne_eur" numeric(8,2) NOT NULL,
        "supplier_threshold_tonnes" numeric(8,1) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_buy_offers_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_group_buy_offers_county" ON "group_buy_offers" ("county")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_group_buy_offers_expires_at" ON "group_buy_offers" ("expires_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "group_buy_participants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "offer_id" uuid NOT NULL,
        "farm_id" uuid NOT NULL,
        "quantity_tonnes" numeric(8,2) NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_group_buy_participants_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_group_buy_participants_offer" FOREIGN KEY ("offer_id") REFERENCES "group_buy_offers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_group_buy_participants_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_group_buy_participants_offer_farm" ON "group_buy_participants" ("offer_id", "farm_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_group_buy_participants_offer_farm"`);
    await queryRunner.query(`DROP TABLE "group_buy_participants"`);
    await queryRunner.query(`DROP INDEX "IDX_group_buy_offers_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_group_buy_offers_county"`);
    await queryRunner.query(`DROP TABLE "group_buy_offers"`);
  }
}
