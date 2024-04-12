import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMetadataToGateways1712321813463 implements MigrationInterface {
    name = 'AddedMetadataToGateways1712321813463'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."gateway_placement_enum" AS ENUM('INDOORS', 'OUTDOORS', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "placement" "public"."gateway_placement_enum"`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "modelName" character varying`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "antennaType" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."gateway_status_enum" AS ENUM('IN-OPERATION', 'PROJECT', 'PROTOTYPE', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "status" "public"."gateway_status_enum"`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "gatewayResponsibleName" character varying`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "gatewayResponsibleEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "gatewayResponsiblePhoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "operationalResponsibleName" character varying`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "operationalResponsibleEmail" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "operationalResponsibleEmail"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "operationalResponsibleName"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "gatewayResponsiblePhoneNumber"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "gatewayResponsibleEmail"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "gatewayResponsibleName"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."gateway_status_enum"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "antennaType"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "modelName"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "placement"`);
        await queryRunner.query(`DROP TYPE "public"."gateway_placement_enum"`);
    }

}
