import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedOTAANetworkKey1779744000000 implements MigrationInterface {
  name = "AddedOTAANetworkKey1779744000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "iot_device" ADD "OTAAnetworkKey" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "OTAAnetworkKey"`);
  }
}
