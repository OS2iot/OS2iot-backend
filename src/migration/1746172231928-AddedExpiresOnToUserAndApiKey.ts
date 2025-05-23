import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedExpiresOnToUserAndApiKey1746172231928 implements MigrationInterface {
    name = 'AddedExpiresOnToUserAndApiKey1746172231928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_key" ADD "expiresOn" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" ADD "expiresOn" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "expiresOn"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP COLUMN "expiresOn"`);
    }

}
