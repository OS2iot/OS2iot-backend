import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedDownlink1726042358865 implements MigrationInterface {
    name = 'AddedDownlink1726042358865'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "downlink" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "queueItemId" character varying NOT NULL, "fCntDown" integer, "payload" character varying NOT NULL, "port" integer NOT NULL, "sendAt" TIMESTAMP, "acknowledgedAt" TIMESTAMP, "acknowledged" boolean, "flushed" boolean, "lorawanDeviceId" integer NOT NULL, "createdById" integer, "updatedById" integer, CONSTRAINT "PK_034713e36807457d9c552f25e83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "downlink" ADD CONSTRAINT "FK_ff83875830af0367a7312f6d9d7" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "downlink" ADD CONSTRAINT "FK_30875ec5a2c879cc2f476709a3c" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "downlink" ADD CONSTRAINT "FK_f82800f54d759339c644e900aa7" FOREIGN KEY ("lorawanDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "downlink" DROP CONSTRAINT "FK_f82800f54d759339c644e900aa7"`);
        await queryRunner.query(`ALTER TABLE "downlink" DROP CONSTRAINT "FK_30875ec5a2c879cc2f476709a3c"`);
        await queryRunner.query(`ALTER TABLE "downlink" DROP CONSTRAINT "FK_ff83875830af0367a7312f6d9d7"`);
        await queryRunner.query(`DROP TABLE "downlink"`);
    }

}
