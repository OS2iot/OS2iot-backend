import { MigrationInterface, QueryRunner } from "typeorm";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";

type dbApplication = Application & { belongsToId: number };
type dbIotDevice = IoTDevice & { applicationId: number };
type deviceConnection = { iotDevicePayloadDecoderDataTargetConnectionId: number; iotDeviceId: number };

export class DefaultConnectionToApplication1792562457722 implements MigrationInterface {
  name = "DefaultConnectionToApplication1792562457722";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "iot_device_payload_decoder_data_target_connection" ADD "defaultConnection" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "iot_device_payload_decoder_data_target_connection" ADD "applicationId" integer`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_becd65b6c48d13c78079806431" ON "iot_device_payload_decoder_data_target_connection" ("applicationId", "defaultConnection") WHERE "defaultConnection" = true`
    );
    await queryRunner.query(
      `ALTER TABLE "iot_device_payload_decoder_data_target_connection" ADD CONSTRAINT "FK_e0b3787e3b4d0afeb81777c6403" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    const connections: IoTDevicePayloadDecoderDataTargetConnection[] = await queryRunner.query(
      `SELECT * FROM "iot_device_payload_decoder_data_target_connection"`
    );
    const deviceConnections: deviceConnection[] = await queryRunner.query(
      `SELECT * FROM "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev"`
    );
    const applications: dbApplication[] = await queryRunner.query(`SELECT * FROM "application"`);
    const iotDevices: dbIotDevice[] = await queryRunner.query(`SELECT * FROM "iot_device"`);

    for (const connection of connections) {
      const deviceIds = deviceConnections
        .filter(dc => dc.iotDevicePayloadDecoderDataTargetConnectionId === connection.id)
        .map(c => c.iotDeviceId);
      const iotDevice = iotDevices.find(d => deviceIds.includes(d.id));
      const application = applications.find(a => a.id === iotDevice.applicationId);
      await queryRunner.query(
        `UPDATE "iot_device_payload_decoder_data_target_connection" SET "applicationId" = $1 WHERE "id" = $2`,
        [application.id, connection.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "iot_device_payload_decoder_data_target_connection" DROP CONSTRAINT "FK_e0b3787e3b4d0afeb81777c6403"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_becd65b6c48d13c78079806431"`);
    await queryRunner.query(
      `ALTER TABLE "iot_device_payload_decoder_data_target_connection" DROP COLUMN "applicationId"`
    );
    await queryRunner.query(
      `ALTER TABLE "iot_device_payload_decoder_data_target_connection" DROP COLUMN "defaultConnection"`
    );
  }
}
