import {MigrationInterface, QueryRunner} from "typeorm";

export class applicationMetadata1646123547110 implements MigrationInterface {
    name = 'applicationMetadata1646123547110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ADD "metadata" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "metadata"`);
    }

}
