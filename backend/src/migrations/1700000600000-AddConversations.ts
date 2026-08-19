import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversations1700000600000 implements MigrationInterface {
  name = 'AddConversations1700000600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversations_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_conversations_farm_id" ON "conversations" ("farm_id")`,
    );

    await queryRunner.query(`CREATE TYPE "messages_role_enum" AS ENUM ('user', 'assistant')`);
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "conversation_id" uuid NOT NULL,
        "role" "messages_role_enum" NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_conversation_created" ON "messages" ("conversation_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_messages_conversation_created"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TYPE "messages_role_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_conversations_farm_id"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
  }
}
