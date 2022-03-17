import {MigrationInterface, QueryRunner} from "typeorm";

export class messageSplitPayload1647515953339 implements MigrationInterface {
    name = 'messageSplitPayload1647515953339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "received_message" ADD "rssi" integer`);
        await queryRunner.query(`ALTER TABLE "received_message" ADD "snr" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "received_message" DROP COLUMN "snr"`);
        await queryRunner.query(`ALTER TABLE "received_message" DROP COLUMN "rssi"`);
    }

}
