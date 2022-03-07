import {MigrationInterface, QueryRunner} from "typeorm";

export class applicationMetadata1646669134921 implements MigrationInterface {
    name = 'applicationMetadata1646669134921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" DROP CONSTRAINT "FK_c1141b0748c24b2f3e78789b6c8"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" DROP CONSTRAINT "FK_c43a6a56e3ef281cbfba9a77457"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" DROP CONSTRAINT "FK_5b72d197d92b8bafbe7906782ec"`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" DROP CONSTRAINT "FK_0c5a137689ddc88c8257e2cd46f"`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" DROP CONSTRAINT "FK_f502bc0bd3c1406ae2b3dc15628"`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" DROP CONSTRAINT "FK_d38b5d829712b4e0df2bae160f4"`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" DROP CONSTRAINT "FK_9b91f8a9dcc02c5926fced99e1b"`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" DROP CONSTRAINT "FK_c88fdc6da057254fe8f9e155559"`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" DROP CONSTRAINT "FK_daf134b834f403ea98efa1fc09f"`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" DROP CONSTRAINT "FK_c1bbb34687ca84f2a166ee376e2"`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" DROP CONSTRAINT "FK_6c691b1ba972915dc7bf3244204"`);
        await queryRunner.query(`CREATE TABLE "controlled_property" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "createdById" integer, "updatedById" integer, "applicationId" integer, CONSTRAINT "PK_b241e3f7ab75d1863a970e5c034" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "application_device_type" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "createdById" integer, "updatedById" integer, "applicationId" integer, CONSTRAINT "PK_ffd5a25180653136c950debb749" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "application" ADD "status" character varying`);
        await queryRunner.query(`ALTER TABLE "application" ADD "startDate" TIMESTAMP DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application" ADD "endDate" TIMESTAMP DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "application" ADD "category" character varying`);
        await queryRunner.query(`ALTER TABLE "application" ADD "owner" character varying`);
        await queryRunner.query(`ALTER TABLE "application" ADD "contactPerson" character varying`);
        await queryRunner.query(`ALTER TABLE "application" ADD "contactEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "application" ADD "contactPhone" character varying`);
        await queryRunner.query(`ALTER TABLE "application" ADD "personalData" boolean`);
        await queryRunner.query(`ALTER TABLE "application" ADD "hardware" character varying`);
        await queryRunner.query(`ALTER TABLE "controlled_property" ADD CONSTRAINT "FK_a46495bd4d190c7cca98193d0a1" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "controlled_property" ADD CONSTRAINT "FK_fd3a0d44f3a84fdf3d7fbf532c3" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "controlled_property" ADD CONSTRAINT "FK_f6061ec18165aba9103ead7237e" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_device_type" ADD CONSTRAINT "FK_9bd8714c2f09bdf98a7f0ea511d" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_device_type" ADD CONSTRAINT "FK_023677bbb714364dcb2f45f1aa0" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_device_type" ADD CONSTRAINT "FK_ecf9a8fc7e73ea69608dd0a5233" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" ADD CONSTRAINT "FK_c1141b0748c24b2f3e78789b6c8" FOREIGN KEY ("apiKeyId") REFERENCES "api_key"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" ADD CONSTRAINT "FK_5b72d197d92b8bafbe7906782ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" ADD CONSTRAINT "FK_c43a6a56e3ef281cbfba9a77457" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" ADD CONSTRAINT "FK_f502bc0bd3c1406ae2b3dc15628" FOREIGN KEY ("multicastId") REFERENCES "multicast"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" ADD CONSTRAINT "FK_0c5a137689ddc88c8257e2cd46f" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" ADD CONSTRAINT "FK_9b91f8a9dcc02c5926fced99e1b" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" ADD CONSTRAINT "FK_d38b5d829712b4e0df2bae160f4" FOREIGN KEY ("multicastId") REFERENCES "multicast"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" ADD CONSTRAINT "FK_daf134b834f403ea98efa1fc09f" FOREIGN KEY ("iotDevicePayloadDecoderDataTargetConnectionId") REFERENCES "iot_device_payload_decoder_data_target_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" ADD CONSTRAINT "FK_c88fdc6da057254fe8f9e155559" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" ADD CONSTRAINT "FK_6c691b1ba972915dc7bf3244204" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" ADD CONSTRAINT "FK_c1bbb34687ca84f2a166ee376e2" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" DROP CONSTRAINT "FK_c1bbb34687ca84f2a166ee376e2"`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" DROP CONSTRAINT "FK_6c691b1ba972915dc7bf3244204"`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" DROP CONSTRAINT "FK_c88fdc6da057254fe8f9e155559"`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" DROP CONSTRAINT "FK_daf134b834f403ea98efa1fc09f"`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" DROP CONSTRAINT "FK_d38b5d829712b4e0df2bae160f4"`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" DROP CONSTRAINT "FK_9b91f8a9dcc02c5926fced99e1b"`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" DROP CONSTRAINT "FK_0c5a137689ddc88c8257e2cd46f"`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" DROP CONSTRAINT "FK_f502bc0bd3c1406ae2b3dc15628"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" DROP CONSTRAINT "FK_c43a6a56e3ef281cbfba9a77457"`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" DROP CONSTRAINT "FK_5b72d197d92b8bafbe7906782ec"`);
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" DROP CONSTRAINT "FK_c1141b0748c24b2f3e78789b6c8"`);
        await queryRunner.query(`ALTER TABLE "application_device_type" DROP CONSTRAINT "FK_ecf9a8fc7e73ea69608dd0a5233"`);
        await queryRunner.query(`ALTER TABLE "application_device_type" DROP CONSTRAINT "FK_023677bbb714364dcb2f45f1aa0"`);
        await queryRunner.query(`ALTER TABLE "application_device_type" DROP CONSTRAINT "FK_9bd8714c2f09bdf98a7f0ea511d"`);
        await queryRunner.query(`ALTER TABLE "controlled_property" DROP CONSTRAINT "FK_f6061ec18165aba9103ead7237e"`);
        await queryRunner.query(`ALTER TABLE "controlled_property" DROP CONSTRAINT "FK_fd3a0d44f3a84fdf3d7fbf532c3"`);
        await queryRunner.query(`ALTER TABLE "controlled_property" DROP CONSTRAINT "FK_a46495bd4d190c7cca98193d0a1"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "hardware"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "personalData"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "contactPhone"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "contactEmail"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "contactPerson"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "owner"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "endDate"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TABLE "application_device_type"`);
        await queryRunner.query(`DROP TABLE "controlled_property"`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" ADD CONSTRAINT "FK_6c691b1ba972915dc7bf3244204" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "application_permissions_permission" ADD CONSTRAINT "FK_c1bbb34687ca84f2a166ee376e2" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" ADD CONSTRAINT "FK_daf134b834f403ea98efa1fc09f" FOREIGN KEY ("iotDevicePayloadDecoderDataTargetConnectionId") REFERENCES "iot_device_payload_decoder_data_target_connection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev" ADD CONSTRAINT "FK_c88fdc6da057254fe8f9e155559" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" ADD CONSTRAINT "FK_9b91f8a9dcc02c5926fced99e1b" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "iot_device_multicasts_multicast" ADD CONSTRAINT "FK_d38b5d829712b4e0df2bae160f4" FOREIGN KEY ("multicastId") REFERENCES "multicast"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" ADD CONSTRAINT "FK_f502bc0bd3c1406ae2b3dc15628" FOREIGN KEY ("multicastId") REFERENCES "multicast"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "multicast_iot_devices_iot_device" ADD CONSTRAINT "FK_0c5a137689ddc88c8257e2cd46f" FOREIGN KEY ("iotDeviceId") REFERENCES "iot_device"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" ADD CONSTRAINT "FK_5b72d197d92b8bafbe7906782ec" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions_permission" ADD CONSTRAINT "FK_c43a6a56e3ef281cbfba9a77457" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" ADD CONSTRAINT "FK_c1141b0748c24b2f3e78789b6c8" FOREIGN KEY ("apiKeyId") REFERENCES "api_key"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
