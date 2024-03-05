import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedDatabaseEntityForGateways1701090974275 implements MigrationInterface {
    name = 'CreatedDatabaseEntityForGateways1701090974275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "gateway" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying, "gatewayId" character varying NOT NULL, "rxPacketsReceived" integer NOT NULL, "txPacketsEmitted" integer NOT NULL, "tags" character varying NOT NULL, "location" geometry(Point,4326), "lastSeenAt" TIMESTAMP, "createdById" integer, "updatedById" integer, "organizationId" integer, CONSTRAINT "PK_22c5b7ecdd6313de143815f9991" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD CONSTRAINT "FK_a869dbb323b91ec9fa272654ce1" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD CONSTRAINT "FK_9916ae412fb9b02b981d094697b" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD CONSTRAINT "FK_66c3f3b7ccab40c8735e2cf07e7" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" DROP CONSTRAINT "FK_66c3f3b7ccab40c8735e2cf07e7"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP CONSTRAINT "FK_9916ae412fb9b02b981d094697b"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP CONSTRAINT "FK_a869dbb323b91ec9fa272654ce1"`);
        await queryRunner.query(`DROP TABLE "gateway"`);
    }

}
