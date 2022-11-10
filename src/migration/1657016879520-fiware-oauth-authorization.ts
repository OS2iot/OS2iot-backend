import {MigrationInterface, QueryRunner} from "typeorm";

export class fiwareOauthAuthorization1657016879520 implements MigrationInterface {
    name = 'fiwareOauthAuthorization1657016879520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_target" ADD "clientId" character varying`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "clientSecret" character varying`);
        await queryRunner.query(`ALTER TABLE "data_target" ADD "tokenEndpoint" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "tokenEndpoint"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "clientSecret"`);
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "clientId"`);
    }

}
