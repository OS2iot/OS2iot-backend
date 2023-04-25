import { MigrationInterface, QueryRunner } from "typeorm";

export class openDataDkDataTarget1681915516234 implements MigrationInterface {
    name = 'openDataDkDataTarget1681915516234'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."data_target_type_enum" RENAME TO "data_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."data_target_type_enum" AS ENUM('HTTP_PUSH', 'FIWARE', 'MQTT', 'OPENDATADK')`);
        await queryRunner.query(`ALTER TABLE "data_target" ALTER COLUMN "type" TYPE "public"."data_target_type_enum" USING "type"::"text"::"public"."data_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."data_target_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."data_target_type_enum_old" AS ENUM('HTTP_PUSH', 'FIWARE', 'MQTT')`);
        await queryRunner.query(`ALTER TABLE "data_target" ALTER COLUMN "type" TYPE "public"."data_target_type_enum_old" USING "type"::"text"::"public"."data_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."data_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."data_target_type_enum_old" RENAME TO "data_target_type_enum"`);
    }

}
