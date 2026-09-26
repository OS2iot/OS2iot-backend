import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedApplicationContactPersons1773473328308 implements MigrationInterface {
    name = 'AddedApplicationContactPersons1773473328308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contact_person" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "role" character varying, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "createdById" integer, "updatedById" integer, "applicationId" integer, CONSTRAINT "PK_12d9c34f76290c4e2ad2aa5e33f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contact_person" ADD CONSTRAINT "FK_e45f40c60ec5ed72ba1fabae2a2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact_person" ADD CONSTRAINT "FK_bb8fef259a0f71539e39aece219" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact_person" ADD CONSTRAINT "FK_fd89e3a2a1cff048fbc66e536fb" FOREIGN KEY ("applicationId") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contact_person" DROP CONSTRAINT "FK_fd89e3a2a1cff048fbc66e536fb"`);
        await queryRunner.query(`ALTER TABLE "contact_person" DROP CONSTRAINT "FK_bb8fef259a0f71539e39aece219"`);
        await queryRunner.query(`ALTER TABLE "contact_person" DROP CONSTRAINT "FK_e45f40c60ec5ed72ba1fabae2a2"`);
        await queryRunner.query(`DROP TABLE "contact_person"`);
    }

}
