import { MigrationInterface, QueryRunner } from "typeorm";

export class mqttBrokerAndSubscriberAdded1683116801992 implements MigrationInterface {
    name = 'mqttBrokerAndSubscriberAdded1683116801992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."iot_device_authenticationtype_enum" AS ENUM('PASSWORD', 'CERTIFICATE')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "authenticationType" "public"."iot_device_authenticationtype_enum"`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "caCertificate" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "deviceCertificate" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "deviceCertificateKey" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttusername" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttpassword" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttURL" character varying`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqttPort" integer`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "mqtttopicname" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."iot_device_permissions_enum" AS ENUM('read', 'write', 'superUser')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "permissions" "public"."iot_device_permissions_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."iot_device_type_enum" RENAME TO "iot_device_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."iot_device_type_enum" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'MQTT_BROKER', 'MQTT_SUBSCRIBER', 'SIGFOX')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum" USING "type"::"text"::"public"."iot_device_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."iot_device_type_enum_old" AS ENUM('GENERIC_HTTP', 'LORAWAN', 'SIGFOX')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "type" TYPE "public"."iot_device_type_enum_old" USING "type"::"text"::"public"."iot_device_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."iot_device_type_enum_old" RENAME TO "iot_device_type_enum"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "permissions"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_permissions_enum"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqtttopicname"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttPort"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttURL"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttpassword"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "mqttusername"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "deviceCertificateKey"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "deviceCertificate"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "caCertificate"`);
        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "authenticationType"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_authenticationtype_enum"`);
    }

}
