import { MigrationInterface, QueryRunner } from "typeorm";

export class MadeDefaultConnectionNonunique1792570063133 implements MigrationInterface {
  name = "MadeDefaultConnectionNonunique1792570063133";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_becd65b6c48d13c78079806431"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_09cc34bf4e8ef65c385aad6590" ON "iot_device_payload_decoder_data_target_connection" ("applicationId", "defaultConnection") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_09cc34bf4e8ef65c385aad6590"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_becd65b6c48d13c78079806431" ON "iot_device_payload_decoder_data_target_connection" ("applicationId", "defaultConnection")`
    );
  }
}
