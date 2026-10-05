import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountMailAndSecurity1791166202278 implements MigrationInterface {
  name = 'AccountMailAndSecurity1791166202278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "locale" character varying(8) NOT NULL DEFAULT 'de'`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "passwordChangedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "proWelcomeSentAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "subscriptionCancelAtPeriodEnd" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN "subscriptionCancelAtPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN "proWelcomeSentAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP COLUMN "passwordChangedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "locale"`);
  }
}
