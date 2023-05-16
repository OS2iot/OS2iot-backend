import { MigrationInterface, QueryRunner } from "typeorm";

export class invalidConfigFieldOnMqttSubscriber1684220398436 implements MigrationInterface {
    name = 'invalidConfigFieldOnMqttSubscriber1684220398436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "invalidMqttConfig" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "invalidMqttConfig"`);
    }

}
