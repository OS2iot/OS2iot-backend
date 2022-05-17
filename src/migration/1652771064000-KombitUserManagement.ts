import {MigrationInterface, QueryRunner} from "typeorm";

export class kombitUserManagement1652771064000 implements MigrationInterface {    
    name = 'kombitUserManagement1652771064000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_requested_organizations_organization" ("userId" integer NOT NULL, "organizationId" integer NOT NULL, CONSTRAINT "PK_b228a18276f4dc0153b74e04370" PRIMARY KEY ("userId", "organizationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87ad1ad67570c6ca20f62c9531" ON "user_requested_organizations_organization" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a0a3602e88b71bc867af425d8" ON "user_requested_organizations_organization" ("organizationId") `);
        await queryRunner.query(`ALTER TABLE "user" ADD "awaitingConfirmation" boolean`);
        await queryRunner.query(`ALTER TABLE "user_requested_organizations_organization" ADD CONSTRAINT "FK_87ad1ad67570c6ca20f62c95313" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_requested_organizations_organization" ADD CONSTRAINT "FK_6a0a3602e88b71bc867af425d89" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_requested_organizations_organization" DROP CONSTRAINT "FK_6a0a3602e88b71bc867af425d89"`);
        await queryRunner.query(`ALTER TABLE "user_requested_organizations_organization" DROP CONSTRAINT "FK_87ad1ad67570c6ca20f62c95313"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "awaitingConfirmation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a0a3602e88b71bc867af425d8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87ad1ad67570c6ca20f62c9531"`);
        await queryRunner.query(`DROP TABLE "user_requested_organizations_organization"`);
    }

}
