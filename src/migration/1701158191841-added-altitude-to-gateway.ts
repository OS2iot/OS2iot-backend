import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedAltitudeToGateway1701158191841 implements MigrationInterface {
    name = 'AddedAltitudeToGateway1701158191841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" ADD "altitude" numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "altitude"`);
    }

}
