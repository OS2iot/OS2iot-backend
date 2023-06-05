import { MigrationInterface, QueryRunner } from "typeorm";

export class renamedMqttDeviceTypes1685019878465 implements MigrationInterface {
    name = "renamedMqttDeviceTypes1685019878465";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."iot_device_type_enum" RENAME TO "iot_device_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."iot_device_type_enum" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'MQTT_BROKER', 'MQTT_SUBSCRIBER', 'MQTT_INTERNAL_BROKER', 'MQTT_EXTERNAL_BROKER', 'SIGFOX')`
        );
        await queryRunner.query(
            `ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum" USING "type"::"text"::"public"."iot_device_type_enum"`
        );
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum_old"`);
        await queryRunner.query(
            `UPDATE "iot_device" SET "type" = 'MQTT_INTERNAL_BROKER' WHERE "type" = 'MQTT_BROKER'`
        );
        await queryRunner.query(
            `UPDATE "iot_device" SET "type" = 'MQTT_EXTERNAL_BROKER' WHERE "type" = 'MQTT_SUBSCRIBER'`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."iot_device_type_enum_old" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'MQTT_BROKER', 'MQTT_SUBSCRIBER', 'SIGFOX')`
        );
        await queryRunner.query(
            `ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum_old" USING "type"::"text"::"public"."iot_device_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."iot_device_type_enum_old" RENAME TO "iot_device_type_enum"`
        );
        await queryRunner.query(
            `UPDATE "iot_device" SET "type" = 'MQTT_BROKER' WHERE "type" = 'MQTT_INTERNAL_BROKER'`
        );
        await queryRunner.query(
            `UPDATE "iot_device" SET "type" = 'MQTT_SUBSCRIBER' WHERE "type" = 'MQTT_EXTERNAL_BROKER'`
        );
    }
}
