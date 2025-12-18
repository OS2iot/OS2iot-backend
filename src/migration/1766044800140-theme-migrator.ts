import { MigrationInterface, QueryRunner } from "typeorm";

export class ThemeMigrator1766044800140 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const datatargets = await queryRunner.query(`SELECT * FROM "open_data_dk_dataset" where "keywords" is not null`);
    datatargets.forEach(async (dataTarget: any) => {
      dataTarget.keywords = dataTarget.keywords.map((k: string) => themes.get(k));

      await queryRunner.query(`UPDATE "open_data_dk_dataset" SET "keywords" = $1 WHERE "id" = $2`, [
        dataTarget.keywords,
        dataTarget.id,
      ]);
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const datatargets = await queryRunner.query(`SELECT * FROM "open_data_dk_dataset" where "keywords" is not null`);
    datatargets.forEach(async (dataTarget: any) => {
      dataTarget.keywords = dataTarget.keywords.map((k: string) => getByValue(themes, k));

      await queryRunner.query(`UPDATE "open_data_dk_dataset" SET "keywords" = $1 WHERE "id" = $2`, [
        dataTarget.keywords,
        dataTarget.id,
      ]);
    });
  }
}

const themes = new Map([
  ["Befolkning og samfund", "SOCI"],
  ["Energi", "ENER"],
  ["Internationale spørgsmål", "INTR"],
  ["Landbrug, fiskeri, skovbrug og fødevarer", "AGRI"],
  ["Midlertidige data", "OP_DATPRO"],
  ["Miljø", "ENVI"],
  ["Regeringen og den offentlige sektor", "GOVE"],
  ["Regioner og byer", "REGI"],
  ["Retfærdighed, retssystem og offentlig sikkerhed", "JUST"],
  ["Sundhed", "HEAL"],
  ["Transport", "TRAN"],
  ["Uddannelse, kultur og sport", "EDUC"],
  ["Videnskab og teknologi", "TECH"],
  ["Økonomi og finanser", "ECON"],
]);

function getByValue(map: Map<string, string>, searchValue: string) {
  for (let [key, value] of map.entries()) {
    if (value === searchValue) return key;
  }
}
