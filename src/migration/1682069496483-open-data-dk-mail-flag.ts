import { MigrationInterface, QueryRunner } from "typeorm";

export class openDataDkMailFlag1682069496483 implements MigrationInterface {
    name = 'openDataDkMailFlag1682069496483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" ADD "openDataDkRegistered" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "openDataDkRegistered"`);
    }

}
