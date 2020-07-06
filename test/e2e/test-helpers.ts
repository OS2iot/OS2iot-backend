import { getManager } from "typeorm";

export async function clearDatabase(): Promise<void> {
    await getManager().query(
        `DELETE FROM "iot_device"; \n` + `DELETE FROM "application";`
    );
}
