import { MigrationInterface, QueryRunner } from "typeorm";

export class basicFieldsForMqttDevice1682335823940 implements MigrationInterface {
    name = 'basicFieldsForMqttDevice1682335823940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."iot_device_authenticationtype_enum" AS ENUM('0', '1')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "authenticationType" "public"."iot_device_authenticationtype_enum"`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "certificate" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "username" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "password" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."iot_device_type_enum" RENAME TO "iot_device_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."iot_device_type_enum" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'MQTT_BROKER', 'SIGFOX')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum" USING "type"::"text"::"public"."iot_device_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."iot_device_type_enum_old" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'SIGFOX')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum_old" USING "type"::"text"::"public"."iot_device_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."iot_device_type_enum_old" RENAME TO "iot_device_type_enum"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "username"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "certificate"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "authenticationType"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_authenticationtype_enum"`);
    }

}
