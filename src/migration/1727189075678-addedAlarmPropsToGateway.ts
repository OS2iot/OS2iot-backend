import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedAlarmPropsToGateway1727189075678 implements MigrationInterface {
  name = "AddedAlarmPropsToGateway1727189075678";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gateway" ADD "notificationOffline" boolean`);
    await queryRunner.query(`ALTER TABLE "gateway" ADD "notificationUnusualPackages" boolean`);
    await queryRunner.query(`ALTER TABLE "gateway" ADD "amountOfMinutes" integer`);
    await queryRunner.query(`ALTER TABLE "gateway" ADD "minimumPackages" integer`);
    await queryRunner.query(`ALTER TABLE "gateway" ADD "maximumPackages" integer`);
    await queryRunner.query(`ALTER TABLE "gateway" ADD "alarmMail" character varying`);
    await queryRunner.query(`ALTER TABLE "gateway" ADD "hasSentOfflineNotification" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "hasSentOfflineNotification"`);
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "alarmMail"`);
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "maximumPackages"`);
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "minimumPackages"`);
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "amountOfMinutes"`);
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "notificationUnusualPackages"`);
    await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "notificationOffline"`);
  }
}
