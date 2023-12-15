import { MigrationInterface, QueryRunner } from "typeorm";

export class addedChirpstackIdToApplication1701260283869 implements MigrationInterface {
    name = 'addedChirpstackIdToApplication1701260283869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" ADD "chirpstackId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "chirpstackId"`);
    }

}
