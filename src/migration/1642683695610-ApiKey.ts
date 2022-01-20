import {MigrationInterface, QueryRunner} from "typeorm";

export class ApiKey1642683695610 implements MigrationInterface {
    name = 'ApiKey1642683695610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "api_key" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "key" character varying NOT NULL, "name" character varying NOT NULL, "createdById" integer, "updatedById" integer, "systemUserId" integer NOT NULL, CONSTRAINT "UQ_fb080786c16de6ace7ed0b69f7d" UNIQUE ("key"), CONSTRAINT "REL_ba0ccb6c48e13f3fe1ff78f3d2" UNIQUE ("systemUserId"), CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "api_key_permissions_permission" ("apiKeyId" integer NOT NULL, "permissionId" integer NOT NULL, CONSTRAINT "PK_61ad0f8361cce05de5ea769351a" PRIMARY KEY ("apiKeyId", "permissionId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c1141b0748c24b2f3e78789b6c" ON "api_key_permissions_permission" ("apiKeyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a77f5c848b7b502da526075eb5" ON "api_key_permissions_permission" ("permissionId") `);
        await queryRunner.query(`ALTER TABLE "user" ADD "isSystemUser" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."permission_type_enum" RENAME TO "permission_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "permission_type_enum" AS ENUM('GlobalAdmin', 'OrganizationAdmin', 'Write', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`);
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum" USING "type"::"text"::"permission_type_enum"`);
        await queryRunner.query(`DROP TYPE "permission_type_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "permission"."type" IS NULL`);
        await queryRunner.query(`ALTER TABLE "api_key" ADD CONSTRAINT "FK_76c1592a8ca784b7b66edfa35d2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key" ADD CONSTRAINT "FK_61eb6b84e8a7efb8617c28c5f1c" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key" ADD CONSTRAINT "FK_ba0ccb6c48e13f3fe1ff78f3d24" FOREIGN KEY ("systemUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" ADD CONSTRAINT "FK_c1141b0748c24b2f3e78789b6c8" FOREIGN KEY ("apiKeyId") REFERENCES "api_key"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" ADD CONSTRAINT "FK_a77f5c848b7b502da526075eb58" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" DROP CONSTRAINT "FK_a77f5c848b7b502da526075eb58"`);
        await queryRunner.query(`ALTER TABLE "api_key_permissions_permission" DROP CONSTRAINT "FK_c1141b0748c24b2f3e78789b6c8"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP CONSTRAINT "FK_ba0ccb6c48e13f3fe1ff78f3d24"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP CONSTRAINT "FK_61eb6b84e8a7efb8617c28c5f1c"`);
        await queryRunner.query(`ALTER TABLE "api_key" DROP CONSTRAINT "FK_76c1592a8ca784b7b66edfa35d2"`);
        await queryRunner.query(`COMMENT ON COLUMN "permission"."type" IS NULL`);
        await queryRunner.query(`CREATE TYPE "permission_type_enum_old" AS ENUM('GlobalAdmin', 'OrganizationAdmin', 'Write', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions')`);
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_old" USING "type"::"text"::"permission_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "permission_type_enum"`);
        await queryRunner.query(`ALTER TYPE "permission_type_enum_old" RENAME TO  "permission_type_enum"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSystemUser"`);
        await queryRunner.query(`DROP INDEX "IDX_a77f5c848b7b502da526075eb5"`);
        await queryRunner.query(`DROP INDEX "IDX_c1141b0748c24b2f3e78789b6c"`);
        await queryRunner.query(`DROP TABLE "api_key_permissions_permission"`);
        await queryRunner.query(`DROP TABLE "api_key"`);
    }

}
