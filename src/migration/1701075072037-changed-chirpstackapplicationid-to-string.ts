import { MigrationInterface, QueryRunner } from "typeorm";

export class changedChirpstackapplicationidToString1701075072037 implements MigrationInterface {
    name = 'changedChirpstackapplicationidToString1701075072037'

    GuidZeros = "00000000-0000-0000-0000-"
    public async up(queryRunner: QueryRunner): Promise<void> {
        //SELECT LORAWAN IDS
        const iotDevices = await queryRunner.query(`SELECT * FROM "iot_device" WHERE TYPE = 'LORAWAN'`)

        //CONVERT TO GUID
        iotDevices.forEach((device: any) => {
            device.chirpstackApplicationId = this.GuidZeros + this.appendZeros(+device.chirpstackApplicationId)
        });

        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "chirpstackApplicationId"`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "chirpstackApplicationId" character varying`);

        //UPDATE IN NEW TABLE
        iotDevices.forEach(async (device: any) => {
            await queryRunner.query(`UPDATE "iot_device" SET "chirpstackApplicationId" = $1 WHERE "id" = $2`, [device.chirpstackApplicationId, device.id]);
        });

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        //SELECT LORAWAN IDS
        const iotDevices = await queryRunner.query(`SELECT * FROM "iot_device" WHERE TYPE = 'LORAWAN'`)

        await queryRunner.query(`ALTER TABLE "iot_device" DROP COLUMN "chirpstackApplicationId"`);
        await queryRunner.query(`ALTER TABLE "iot_device" ADD "chirpstackApplicationId" integer`);


        //CONVERT TO INT
        iotDevices.forEach((device: any) => {
            device.chirpstackApplicationId = parseInt(device.chirpstackApplicationId.slice(-12))
        });

        //UPDATE IN NEW TABLE
        iotDevices.forEach(async (device: any) => {
            await queryRunner.query(`UPDATE "iot_device" SET "chirpstackApplicationId" = $1 WHERE "id" = $2`, [device.chirpstackApplicationId, device.id]);
        });
    }
    private appendZeros(id: number) {
        let numString = id.toString();
        while (numString.length < 12) {
            numString = '0' + numString;
        }
        return numString;
    }

}
