import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReceipts1791163637564 implements MigrationInterface {
    name = 'AddReceipts1791163637564'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "receipts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "merchant" character varying(200) NOT NULL DEFAULT '', "date" date, "total" numeric(12,2), "vatRate" smallint, "vatAmount" numeric(12,2), "documentNumber" character varying(100) NOT NULL DEFAULT '', "category" character varying(32) NOT NULL DEFAULT 'other', "depreciation" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5e8182d7c29e023da6e1ff33bfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_834208ccf727abf5f57f0de627" ON "receipts"  ("accountId", "date") `);
        await queryRunner.query(`ALTER TABLE "receipts" ADD CONSTRAINT "FK_f0b1a963b82cd86e6c620ceaa16" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "receipts" DROP CONSTRAINT "FK_f0b1a963b82cd86e6c620ceaa16"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_834208ccf727abf5f57f0de627"`);
        await queryRunner.query(`DROP TABLE "receipts"`);
    }

}
