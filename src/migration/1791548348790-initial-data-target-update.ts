import { MigrationInterface, QueryRunner } from "typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { Organization } from "@entities/organization.entity";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";

type preMigrationDataTarget = DataTarget & { applicationId: number };
type dbApplication = Application & { belongsToId: number };
type dbDataTarget = DataTarget & { organizationId: number };
type dataTargetConnection = { dataTargetId: number; id: number };
type deviceConnection = { iotDevicePayloadDecoderDataTargetConnectionId: number; iotDeviceId: number };
type dbIotDevice = IoTDevice & { applicationId: number };

export class InitialDataTargetUpdate1791548348790 implements MigrationInterface {
  name = "InitialDataTargetUpdate1791548348790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dataTargets: preMigrationDataTarget[] = await queryRunner.query(`SELECT * FROM "data_target"`);
    const organizations: Organization[] = await queryRunner.query(`SELECT * FROM "organization"`);
    const applications: dbApplication[] = await queryRunner.query(`SELECT * FROM "application"`);

    await queryRunner.query(`ALTER TABLE "data_target" DROP CONSTRAINT "FK_dc5681eea8037a19634c4630057"`);

    for (const dt of dataTargets) {
      const currentApplication = applications.find(a => a.id === dt.applicationId);
      const organization = organizations.find(o => o.id === currentApplication.belongsToId);

      await queryRunner.query(`UPDATE "data_target" SET "applicationId" = $1 WHERE "id" = $2`, [
        organization.id,
        dt.id,
      ]);
    }

    await queryRunner.query(`ALTER TABLE "data_target" RENAME COLUMN "applicationId" TO "organizationId"`);
    await queryRunner.query(`ALTER TABLE "permission_type" DROP CONSTRAINT "UQ_3acd70f5a3895ee2fb92b2a4290"`);
    await queryRunner.query(
      `ALTER TYPE "public"."permission_type_type_enum" RENAME TO "permission_type_type_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."permission_type_type_enum" AS ENUM('GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'OrganizationDataTargetAdmin', 'Read')`
    );
    await queryRunner.query(
      `ALTER TABLE "permission_type" ALTER COLUMN "type" TYPE "public"."permission_type_type_enum" USING "type"::"text"::"public"."permission_type_type_enum"`
    );

    for (const organization of organizations) {
      const permission = await queryRunner.query(
        `INSERT INTO "permission"  ("createdAt", "updatedAt", "name", "automaticallyAddNewApplications","organizationId") VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $1, true, $2)
          RETURNING id`,
        [`${organization.name} - Datatarget administrator`, organization.id]
      );
      const permissionId = permission[0].id;
      await queryRunner.query(
        `INSERT INTO "permission_type"  ("createdAt", "updatedAt", "type", "permissionId") VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'OrganizationDataTargetAdmin',$1)`,
        [permissionId]
      );
      await queryRunner.query(
        `INSERT INTO "permission_type"  ("createdAt", "updatedAt", "type", "permissionId") VALUES (CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Read',$1)`,
        [permissionId]
      );
    }

    await queryRunner.query(`DROP TYPE "public"."permission_type_type_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "permission_type" ADD CONSTRAINT "UQ_3acd70f5a3895ee2fb92b2a4290" UNIQUE ("type", "permissionId")`
    );
    await queryRunner.query(
      `ALTER TABLE "data_target" ADD CONSTRAINT "FK_981d619bc8d11fdacdd3b197cd6" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "data_target" DROP CONSTRAINT "FK_981d619bc8d11fdacdd3b197cd6"`);
    await queryRunner.query(`ALTER TABLE "permission_type" DROP CONSTRAINT "UQ_3acd70f5a3895ee2fb92b2a4290"`);
    await queryRunner.query(
      `CREATE TYPE "public"."permission_type_type_enum_old" AS ENUM('GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read')`
    );

    await queryRunner.query(`DELETE FROM "permission_type" where "type" = 'OrganizationDataTargetAdmin'`);

    await queryRunner.query(
      `ALTER TABLE "permission_type" ALTER COLUMN "type" TYPE "public"."permission_type_type_enum_old" USING "type"::"text"::"public"."permission_type_type_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."permission_type_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."permission_type_type_enum_old" RENAME TO "permission_type_type_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "permission_type" ADD CONSTRAINT "UQ_3acd70f5a3895ee2fb92b2a4290" UNIQUE ("type", "permissionId")`
    );

    const dataTargets: dbDataTarget[] = await queryRunner.query(`SELECT * FROM "data_target"`);
    const applications: dbApplication[] = await queryRunner.query(`SELECT * FROM "application"`);
    const connections: dataTargetConnection[] = await queryRunner.query(
      `SELECT * FROM "iot_device_payload_decoder_data_target_connection"`
    );
    const deviceConnections: deviceConnection[] = await queryRunner.query(
      `SELECT * FROM "iot_dev_pay_dec_dat_tar_con_iot_dev_iot_dev"`
    );
    const iotDevices: dbIotDevice[] = await queryRunner.query(`SELECT * FROM "iot_device"`);

    for (const dt of dataTargets) {
      const connection = connections.find(c => c.dataTargetId === dt.id);

      const deviceIds = deviceConnections
        .filter(dc => dc.iotDevicePayloadDecoderDataTargetConnectionId === connection.id)
        .map(c => c.iotDeviceId);
      const iotDevice = iotDevices.find(d => deviceIds.includes(d.id));

      const application = applications.find(a => a.id === iotDevice.applicationId);

      await queryRunner.query(`UPDATE "data_target" SET "organizationId" = $1 WHERE "id" = $2`, [
        application.id,
        dt.id,
      ]);
    }

    await queryRunner.query(`ALTER TABLE "data_target" RENAME COLUMN "organizationId" TO "applicationId"`);
    await queryRunner.query(
      `ALTER TABLE "data_target" ADD CONSTRAINT "FK_dc5681eea8037a19634c4630057" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
