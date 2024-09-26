import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedAlarmPropsToGateway1727271446786 implements MigrationInterface {
    name = 'AddedAlarmPropsToGateway1727271446786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" ADD "notifyOffline" boolean`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "notifyUnusualPackages" boolean`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "offlineAlarmThresholdMinutes" integer`);
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
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "offlineAlarmThresholdMinutes"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "notifyUnusualPackages"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "notifyOffline"`);
    }

}
