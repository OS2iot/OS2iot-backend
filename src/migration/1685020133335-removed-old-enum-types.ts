import { MigrationInterface, QueryRunner } from "typeorm";

export class removedOldEnumTypes1685020133335 implements MigrationInterface {
    name = 'removedOldEnumTypes1685020133335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."iot_device_type_enum" RENAME TO "iot_device_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."iot_device_type_enum" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'MQTT_INTERNAL_BROKER', 'MQTT_EXTERNAL_BROKER', 'SIGFOX')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum" USING "type"::"text"::"public"."iot_device_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."iot_device_type_enum_old" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'MQTT_BROKER', 'MQTT_SUBSCRIBER', 'MQTT_INTERNAL_BROKER', 'MQTT_EXTERNAL_BROKER', 'SIGFOX')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum_old" USING "type"::"text"::"public"."iot_device_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."iot_device_type_enum_old" RENAME TO "iot_device_type_enum"`);
    }

}
