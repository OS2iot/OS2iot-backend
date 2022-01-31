import {MigrationInterface, QueryRunner} from "typeorm";

export class multicast1642075074141 implements MigrationInterface {
    name = 'multicast1642075074141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lorawan-multicast" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "address" character varying NOT NULL, "networkSessionKey" character varying NOT NULL, "applicationSessionKey" character varying NOT NULL, "frameCounter" integer NOT NULL, "dataRate" integer NOT NULL, "frequency" integer NOT NULL, "groupType" character varying NOT NULL, "chirpstackGroupId" character varying, "createdById" integer, "updatedById" integer, CONSTRAINT "PK_3a1533b403f6e38b0ec4df5aee5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "multicast" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "groupName" character varying NOT NULL, "createdById" integer, "updatedById" integer, "applicationId" integer, "lorawanMulticastDefinitionId" integer, CONSTRAINT "REL_5a058ff45da16000d4e3b409e3" UNIQUE ("lorawanMulticastDefinitionId"), CONSTRAINT "PK_5c305350f804318120f45107a64" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "multicast_iot_devices_iot_device" ("multicastId" integer NOT NULL, "iotDeviceId" integer NOT NULL, CONSTRAINT "PK_281c23f69718bec32d05cd8398c" PRIMARY KEY ("multicastId", "iotDeviceId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f502bc0bd3c1406ae2b3dc1562" ON "multicast_iot_devices_iot_device" ("multicastId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0c5a137689ddc88c8257e2cd46" ON "multicast_iot_devices_iot_device" ("iotDeviceId") `);
        await queryRunner.query(`CREATE TABLE "iot_device_multicasts_multicast" ("iotDeviceId" integer NOT NULL, "multicastId" integer NOT NULL, CONSTRAINT "PK_d3186bb9eaa001bf2ea3ccefa37" PRIMARY KEY ("iotDeviceId", "multicastId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9b91f8a9dcc02c5926fced99e1" ON "iot_device_multicasts_multicast" ("iotDeviceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d38b5d829712b4e0df2bae160f" ON "iot_device_multicasts_multicast" ("multicastId") `);
        await queryRunner.query(`ALTER TABLE "lorawan-multicast" ADD CONSTRAINT "FK_bfb223faca94d9e217c39439c49" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lorawan-multicast" ADD CONSTRAINT "FK_c776cdd3a4b1818c0995ee60baa" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast" ADD CONSTRAINT "FK_60c29583cfbafbd6b0e1a9679c9" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast" ADD CONSTRAINT "FK_0000d423c968ec8ba68482f8b0b" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast" ADD CONSTRAINT "FK_ea6c184aa80e1f16cc8edb8e743" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast" ADD CONSTRAINT "FK_5a058ff45da16000d4e3b409e36" FOREIGN KEY ("lorawanMulticastDefinitionId") REFERENCES "lorawan-multicast"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" ADD CONSTRAINT "FK_f502bc0bd3c1406ae2b3dc15628" FOREIGN KEY ("multicastId") REFERENCES "multicast"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" ADD CONSTRAINT "FK_0c5a137689ddc88c8257e2cd46f" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" ADD CONSTRAINT "FK_9b91f8a9dcc02c5926fced99e1b" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" ADD CONSTRAINT "FK_d38b5d829712b4e0df2bae160f4" FOREIGN KEY ("multicastId") REFERENCES "multicast"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" DROP CONSTRAINT "FK_d38b5d829712b4e0df2bae160f4"`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" DROP CONSTRAINT "FK_9b91f8a9dcc02c5926fced99e1b"`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" DROP CONSTRAINT "FK_0c5a137689ddc88c8257e2cd46f"`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" DROP CONSTRAINT "FK_f502bc0bd3c1406ae2b3dc15628"`);
        await queryRunner.query(`ALTER TABLE "multicast" DROP CONSTRAINT "FK_5a058ff45da16000d4e3b409e36"`);
        await queryRunner.query(`ALTER TABLE "multicast" DROP CONSTRAINT "FK_ea6c184aa80e1f16cc8edb8e743"`);
        await queryRunner.query(`ALTER TABLE "multicast" DROP CONSTRAINT "FK_0000d423c968ec8ba68482f8b0b"`);
        await queryRunner.query(`ALTER TABLE "multicast" DROP CONSTRAINT "FK_60c29583cfbafbd6b0e1a9679c9"`);
        await queryRunner.query(`ALTER TABLE "lorawan-multicast" DROP CONSTRAINT "FK_c776cdd3a4b1818c0995ee60baa"`);
        await queryRunner.query(`ALTER TABLE "lorawan-multicast" DROP CONSTRAINT "FK_bfb223faca94d9e217c39439c49"`);
        await queryRunner.query(`DROP INDEX "IDX_d38b5d829712b4e0df2bae160f"`);
        await queryRunner.query(`DROP INDEX "IDX_9b91f8a9dcc02c5926fced99e1"`);
        await queryRunner.query(`DROP TABLE "iot_device_multicasts_multicast"`);
        await queryRunner.query(`DROP INDEX "IDX_0c5a137689ddc88c8257e2cd46"`);
        await queryRunner.query(`DROP INDEX "IDX_f502bc0bd3c1406ae2b3dc1562"`);
        await queryRunner.query(`DROP TABLE "multicast_iot_devices_iot_device"`);
        await queryRunner.query(`DROP TABLE "multicast"`);
        await queryRunner.query(`DROP TABLE "lorawan-multicast"`);
    }

}
