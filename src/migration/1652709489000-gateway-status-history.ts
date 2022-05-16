import {MigrationInterface, QueryRunner} from "typeorm";

export class gatewayStatusHistory1652709489000 implements MigrationInterface {    
    name = 'gatewayStatusHistory1652709489000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "gateway_status_history" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "mac" character varying NOT NULL, "wasOnline" boolean NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "updatedById" integer, CONSTRAINT "UQ_5370e37f34adf6e9c9350bc46c7" UNIQUE ("mac", "timestamp"), CONSTRAINT "PK_defafcb0f6f1ba7a612395b62f8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "gateway_status_history" ADD CONSTRAINT "FK_196255adef4a4011a1dea022630" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gateway_status_history" ADD CONSTRAINT "FK_94b6a464efce5a478b185bf7e89" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway_status_history" DROP CONSTRAINT "FK_94b6a464efce5a478b185bf7e89"`);
        await queryRunner.query(`ALTER TABLE "gateway_status_history" DROP CONSTRAINT "FK_196255adef4a4011a1dea022630"`);
        await queryRunner.query(`DROP TABLE "gateway_status_history"`);
    }

}
