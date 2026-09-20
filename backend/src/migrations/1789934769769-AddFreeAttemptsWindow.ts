import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFreeAttemptsWindow1789934769769 implements MigrationInterface {
    name = 'AddFreeAttemptsWindow1789934769769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "freeAttemptsWindowStartedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "freeAttemptsWindowStartedAt"`);
    }

}
