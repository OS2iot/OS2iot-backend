import { MigrationInterface, QueryRunner } from "typeorm";

export class urlBrokerFields1682423454516 implements MigrationInterface {
    name = 'urlBrokerFields1682423454516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "uRL" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "topicId" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "topicName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "topicName"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "topicId"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "uRL"`);
    }

}
