import { MigrationInterface, QueryRunner } from "typeorm";

export class DatatargetLog1726653509863 implements MigrationInterface {
    name = 'DatatargetLog1726653509863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_target" ADD "lastMessageDate" TIMESTAMP`);
        await queryRunner.query(`CREATE TABLE "datatarget-log" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "statusCode" integer, "message" character varying, "createdById" integer, "updatedById" integer, "datatargetId" integer, "iotDeviceId" integer, "payloadDecoderId" integer, CONSTRAINT "PK_f853c6517b8a428fa350221a0f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1d333574ef086bee54ff78b2e0" ON "datatarget-log" ("datatargetId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "datatarget-log" ADD CONSTRAINT "FK_2f62220b03e524c7a056890fb3b" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datatarget-log" ADD CONSTRAINT "FK_7bcebf642504f26aa8c03074cca" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datatarget-log" ADD CONSTRAINT "FK_0e1507ac15e7d6755273691345e" FOREIGN KEY ("datatargetId") REFERENCES "data_target"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datatarget-log" ADD CONSTRAINT "FK_4fd74ac0a22db2f38e6b420a657" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "datatarget-log" ADD CONSTRAINT "FK_28c126089e5dac0360926acf819" FOREIGN KEY ("payloadDecoderId") REFERENCES "payload_decoder"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "data_target" DROP COLUMN "lastMessageDate"`);
        await queryRunner.query(`DROP TABLE "datatarget-log"`);
    }

}
