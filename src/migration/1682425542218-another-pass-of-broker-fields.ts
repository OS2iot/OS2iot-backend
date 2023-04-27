import { MigrationInterface, QueryRunner } from "typeorm";

export class anotherPassOfBrokerFields1682425542218 implements MigrationInterface {
    name = 'anotherPassOfBrokerFields1682425542218'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "topicId"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "topicName"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "uRL"`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttUsername" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttPassword" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttURL" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttTopicName" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "readWrite" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "readWrite"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttTopicName"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttURL"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttPassword"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttUsername"`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "uRL" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "password" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "username" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "topicName" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "topicId" character varying`);
    }

}
