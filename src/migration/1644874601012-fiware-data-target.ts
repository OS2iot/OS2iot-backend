import {MigrationInterface, QueryRunner} from "typeorm";

export class fiwareDataTarget1644874601012 implements MigrationInterface {
    name = 'fiwareDataTarget1644874601012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_target" ADD "tenant" character varying`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "context" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."data_target_type_enum" RENAME TO "data_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "data_target_type_enum" AS ENUM('HTTP_PUSH', 'FIWARE')`);
        await queryRunner.query(`ALTER TABLE "data_target" ALTER COLUMN "type" TYPE "data_target_type_enum" USING "type"::"text"::"data_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "data_target_type_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "data_target"."type" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "data_target"."type" IS NULL`);
        await queryRunner.query(`CREATE TYPE "data_target_type_enum_old" AS ENUM('HTTP_PUSH')`);
        await queryRunner.query(`ALTER TABLE "data_target" ALTER COLUMN "type" TYPE "data_target_type_enum_old" USING "type"::"text"::"data_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "data_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "data_target_type_enum_old" RENAME TO  "data_target_type_enum"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "context"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "tenant"`);
    }

}
