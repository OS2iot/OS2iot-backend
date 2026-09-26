import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApplicationMetadata1773923548971 implements MigrationInterface {
    name = 'AddApplicationMetadata1773923548971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "metadata"`);
    }

}
