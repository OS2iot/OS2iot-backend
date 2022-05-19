import {MigrationInterface, QueryRunner} from "typeorm";

export class welcomeScreen1652342361070 implements MigrationInterface {
    name = 'welcomeScreen1652342361070'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "showWelcomeScreen" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "showWelcomeScreen"`);
    }

}
