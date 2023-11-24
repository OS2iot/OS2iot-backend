import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedChirpstackDataToIotDevice1700748970060 implements MigrationInterface {
    name = 'AddedChirpstackDataToIotDevice1700748970060'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "OTAAapplicationKey" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "deviceProfileName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "deviceProfileName"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "OTAAapplicationKey"`);
    }

}
