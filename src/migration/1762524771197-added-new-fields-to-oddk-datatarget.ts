import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedNewFieldsToOddkDatatarget1762524771197 implements MigrationInterface {
    name = 'AddedNewFieldsToOddkDatatarget1762524771197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" ADD "keywordTags" character varying`);
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" ADD "updateFrequency" character varying`);
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" ADD "documentationUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" ADD "dataDirectory" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" DROP COLUMN "dataDirectory"`);
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" DROP COLUMN "documentationUrl"`);
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" DROP COLUMN "updateFrequency"`);
        await queryRunner.query(`ALTER TABLE "open_data_dk_dataset" DROP COLUMN "keywordTags"`);
    }

}
