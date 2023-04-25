import { MigrationInterface, QueryRunner } from "typeorm";

export class moreFieldsForMqttBroker1682416342306 implements MigrationInterface {
    name = 'moreFieldsForMqttBroker1682416342306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."iot_device_authenticationtype_enum" RENAME TO "iot_device_authenticationtype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."iot_device_authenticationtype_enum" AS ENUM('PASSWORD', 'CERTIFICATE')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "authenticationType" TYPE "public"."iot_device_authenticationtype_enum" USING "authenticationType"::"text"::"public"."iot_device_authenticationtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_authenticationtype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."iot_device_authenticationtype_enum_old" AS ENUM('0', '1')`);
        await queryRunner.query(`ALTER TABLE "iot_device" ALTER COLUMN "authenticationType" TYPE "public"."iot_device_authenticationtype_enum_old" USING "authenticationType"::"text"::"public"."iot_device_authenticationtype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."iot_device_authenticationtype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."iot_device_authenticationtype_enum_old" RENAME TO "iot_device_authenticationtype_enum"`);
    }

}
