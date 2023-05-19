import { MigrationInterface, QueryRunner } from "typeorm";

export class addedFieldExplicitlyForHashedPassword1684328159350 implements MigrationInterface {
    name = 'addedFieldExplicitlyForHashedPassword1684328159350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttpasswordhash" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttpasswordhash"`);
    }

}
