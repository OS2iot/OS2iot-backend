import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMoreAlarmPropsToGateway1727171112171 implements MigrationInterface {
    name = 'AddedMoreAlarmPropsToGateway1727171112171'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" ADD "hasSentOfflineNotification" boolean`);
        await queryRunner.query(`ALTER TABLE "gateway" ADD "lastSentNotification" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "lastSentNotification"`);
        await queryRunner.query(`ALTER TABLE "gateway" DROP COLUMN "hasSentOfflineNotification"`);
    }

}
