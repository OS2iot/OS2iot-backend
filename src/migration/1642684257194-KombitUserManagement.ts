import {MigrationInterface, QueryRunner} from "typeorm";

export class KombitUserManagement1642684257194 implements MigrationInterface {
    name = 'KombitUserManagement1642684257194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_organizations_organization" ("userId" integer NOT NULL, "organizationId" integer NOT NULL, CONSTRAINT "PK_d89fbba617c90c71e2fc0bee26f" PRIMARY KEY ("userId", "organizationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ad3d8541fbdb5a3d137c50fb4" ON "user_organizations_organization" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8d7c566d5a234be0a646101326" ON "user_organizations_organization" ("organizationId") `);
        await queryRunner.query(`ALTER TABLE "user" ADD "awaitingConfirmation" boolean`);
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" ADD CONSTRAINT "FK_7ad3d8541fbdb5a3d137c50fb40" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" ADD CONSTRAINT "FK_8d7c566d5a234be0a6461013269" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" DROP CONSTRAINT "FK_8d7c566d5a234be0a6461013269"`);
        await queryRunner.query(`ALTER TABLE "user_organizations_organization" DROP CONSTRAINT "FK_7ad3d8541fbdb5a3d137c50fb40"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "awaitingConfirmation"`);
        await queryRunner.query(`DROP INDEX "IDX_8d7c566d5a234be0a646101326"`);
        await queryRunner.query(`DROP INDEX "IDX_7ad3d8541fbdb5a3d137c50fb4"`);
        await queryRunner.query(`DROP TABLE "user_organizations_organization"`);
    }

}
