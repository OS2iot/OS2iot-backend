import {MigrationInterface, QueryRunner} from "typeorm";

export class messageSplitSignalData1650977033975 implements MigrationInterface {
    name = 'messageSplitSignalData1650977033975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "received_message_sigfox_signals" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "sentTime" TIMESTAMP NOT NULL, "rssi" integer, "snr" integer, "createdById" integer, "updatedById" integer, "deviceId" integer, CONSTRAINT "PK_0b7c7eccc0a9f8ec82034b0a1d5" PRIMARY KEY ("id")); COMMENT ON COLUMN "received_message_sigfox_signals"."sentTime" IS 'Time reported by device (if possible, otherwise time received)'`);
        await queryRunner.query(`ALTER TABLE "received_message" ADD "rssi" integer`);
        await queryRunner.query(`ALTER TABLE "received_message" ADD "snr" integer`);
        await queryRunner.query(`ALTER TABLE "received_message_sigfox_signals" ADD CONSTRAINT "FK_ac3bca1b1dc1035d34473cd9893" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "received_message_sigfox_signals" ADD CONSTRAINT "FK_4c51b3e6b59facfa88ad77f347a" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "received_message_sigfox_signals" ADD CONSTRAINT "FK_11daab3788340575ecb4d119155" FOREIGN KEY ("deviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "received_message_sigfox_signals" DROP CONSTRAINT "FK_11daab3788340575ecb4d119155"`);
        await queryRunner.query(`ALTER TABLE "received_message_sigfox_signals" DROP CONSTRAINT "FK_4c51b3e6b59facfa88ad77f347a"`);
        await queryRunner.query(`ALTER TABLE "received_message_sigfox_signals" DROP CONSTRAINT "FK_ac3bca1b1dc1035d34473cd9893"`);
        await queryRunner.query(`ALTER TABLE "received_message" DROP COLUMN "snr"`);
        await queryRunner.query(`ALTER TABLE "received_message" DROP COLUMN "rssi"`);
        await queryRunner.query(`DROP TABLE "received_message_sigfox_signals"`);
    }

}
