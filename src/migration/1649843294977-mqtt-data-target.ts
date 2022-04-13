import {MigrationInterface, QueryRunner} from "typeorm";

export class mqttDataTarget1649843294977 implements MigrationInterface {
    name = 'mqttDataTarget1649843294977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_target" ADD "mqttPort" integer`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "mqttTopic" character varying`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "mqttQos" integer`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "mqttUsername" character varying`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "mqttPassword" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."data_target_type_enum" RENAME TO "data_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."data_target_type_enum" AS ENUM('HTTP_PUSH', 'FIWARE', 'MQTT')`);
        await queryRunner.query(`ALTER TABLE "data_target" ALTER COLUMN "type" TYPE "public"."data_target_type_enum" USING "type"::"text"::"public"."data_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."data_target_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."data_target_type_enum_old" AS ENUM('HTTP_PUSH', 'FIWARE')`);
        await queryRunner.query(`ALTER TABLE "data_target" ALTER COLUMN "type" TYPE "public"."data_target_type_enum_old" USING "type"::"text"::"public"."data_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."data_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."data_target_type_enum_old" RENAME TO "data_target_type_enum"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "mqttPassword"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "mqttUsername"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "mqttQos"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "mqttTopic"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "mqttPort"`);
    }

}
