import { MigrationInterface, QueryRunner } from "typeorm";
import { NotImplementedException } from "@nestjs/common";

type AppPermissions = {
    applicationId: number;
    permissionId: number;
}[];

type ApiKeyPermissions = {
    apiKeyId: number;
    permissionId: number;
}[];

type PermissionInfo = {
    id: number;
    clonedFromId: number;
};

type UserPermissionInfo = PermissionInfo & {
    userId?: number;
};

type AppPermissionInfo = PermissionInfo & {
    applicationId?: number;
};

type ApiKeyPermissionInfo = PermissionInfo & {
	apiKeyId?: number;
}

type UserPermissions = {
    userId: number;
    permissionId: number;
}[];

export class revisedPermissions1651142158492 implements MigrationInterface {
	name = "revisedPermissions1651142158492";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."permission_type_enum" RENAME TO "permission_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "permission_type_enum" AS ENUM('GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`
        );

        // Migrates existing data. This can result in duplicate permissions and duplicates of its dependents
        // Must be resolved by a user administrator or above or directly on the database
        await this.migrateUp(queryRunner);

        // await queryRunner.query(
        //     `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum" USING "type"::"text"::"permission_type_enum"`
        // );
        await queryRunner.query(`DROP TYPE "permission_type_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "permission"."type" IS NULL`);

        // Update permission so it can refer to multiple types
        await this.migratePermissionTypeUp(queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "permission"."type" IS NULL`);
        await queryRunner.query(
            `CREATE TYPE "permission_type_enum_old" AS ENUM('GlobalAdmin', 'OrganizationAdmin', 'Write', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`
        );

        // Migrates existing data. This can result in duplicate permissions and duplicates of its dependents
        // ASSUMPTION: this migration is only reverted immediately after executing it.
        // There's no 1-1 translation between the three organization admin permissions and the old ones. Ex. OrganizationGatewayAdmin has no equivalent
        // To avoid elevating users unexpectedly, for security reasons, we translate them to "Read".
        await this.migrateDown(queryRunner);

        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_old" USING "type"::"text"::"permission_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "permission_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "permission_type_enum_old" RENAME TO  "permission_type_enum"`
        );

        await this.migratePermissionTypeDown(queryRunner);
    }

    private async migrateUp(queryRunner: QueryRunner): Promise<void> {
        // Create a temporary enum which is a union of both old and new enum values
        await queryRunner.query(
            `CREATE TYPE "permission_type_enum_temp" AS ENUM('OrganizationAdmin', 'Write', 'GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`
        );
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_temp" USING "type"::"text"::"permission_type_enum_temp"`
        );

        // When migrating permisisons tied to old permission types, we need to keep track of the old id. This is for updating any dependents
        await queryRunner.query(
            `ALTER TABLE "permission" ADD COLUMN "clonedFromId" integer`
        );

        // Begin cloning. Store both the old and new ids as mappings
        const applicationAdminFromWriteInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("Write", "OrganizationApplicationAdmin")
        );
        const readFromWriteInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("Write", "Read")
        );
        const userAdminFromOrgAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationAdmin", "OrganizationUserAdmin")
        );
        const applicationAdminFromOrgAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationAdmin", "OrganizationApplicationAdmin")
        );
        const gatewayAdminFromOrgAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationAdmin", "OrganizationGatewayAdmin")
        );
        const readAdminFromOrgAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationAdmin", "Read")
        );

        // Migrate entities in other tables with a foreign key to the permission table
        await this.migrateUserPermissions (
            queryRunner,
            applicationAdminFromWriteInfo,
            readFromWriteInfo,
            userAdminFromOrgAdminInfo,
            applicationAdminFromOrgAdminInfo,
            gatewayAdminFromOrgAdminInfo,
            readAdminFromOrgAdminInfo
        );

        await this.migrateApplicationPermissions (
            queryRunner,
            applicationAdminFromWriteInfo,
            readFromWriteInfo,
            userAdminFromOrgAdminInfo,
            applicationAdminFromOrgAdminInfo,
            gatewayAdminFromOrgAdminInfo,
            readAdminFromOrgAdminInfo
        );

		await this.migrateApiKeyPermissions (
            queryRunner,
            applicationAdminFromWriteInfo,
            readFromWriteInfo,
            userAdminFromOrgAdminInfo,
            applicationAdminFromOrgAdminInfo,
            gatewayAdminFromOrgAdminInfo,
            readAdminFromOrgAdminInfo
        );

        // Cleanup
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "clonedFromId"`);

        await queryRunner.query(`DELETE FROM user_permissions_permission
WHERE "permissionId" IN
(
    SELECT "permission"."id" FROM user_permissions_permission
    JOIN permission ON permission.id = "public"."user_permissions_permission"."permissionId"
    WHERE permission.type IN ('Write', 'OrganizationAdmin')
);`);

		await queryRunner.query(`DELETE FROM application_permissions_permission
WHERE "permissionId" IN
(
    SELECT "permission"."id" FROM application_permissions_permission
    JOIN permission ON permission.id = "public"."application_permissions_permission"."permissionId"
    WHERE permission.type IN ('Write', 'OrganizationAdmin')
)`);

		await queryRunner.query(`DELETE FROM api_key_permissions_permission
WHERE "permissionId" IN
(
    SELECT "permission"."id" FROM api_key_permissions_permission
    JOIN permission ON permission.id = "public"."api_key_permissions_permission"."permissionId"
    WHERE permission.type IN ('Write', 'OrganizationAdmin')
)`);

        await queryRunner.query(
            `DELETE FROM "public"."permission" where type IN ('OrganizationAdmin', 'Write')`
        );
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum" USING "type"::"text"::"permission_type_enum"`
        );
        await queryRunner.query(`DROP TYPE "permission_type_enum_temp"`);
    }

    private async migrateUserPermissions(
        queryRunner: QueryRunner,
        ...permissionInfos: PermissionInfo[][]
    ) {
        // User-permission table depends on permission. Fetch and map the user ids
        const userPermissions: UserPermissions = await queryRunner.query(`select "userId",
        "permissionId"
 from public.user_permissions_permission`);

        // .reduce instead of .flatmap as it's only available in ES2019+
        const newUserPermissions: UserPermissionInfo[] = permissionInfos.reduce(
            (acc, info) => acc.concat(this.mapUserPermissions(userPermissions, info)),
            []
        );

        // User-permission table
        await queryRunner.query(this.copyUserPermissionsQuery(newUserPermissions));
    }

    private async migrateApplicationPermissions(
        queryRunner: QueryRunner,
        ...permissionInfos: PermissionInfo[][]
    ) {
        const appPermissions: AppPermissions = await queryRunner.query(`select  "applicationId"
,"permissionId"
from public.application_permissions_permission`);

        // .reduce instead of .flatmap as it's only available in ES2019+
        const newAppPermissions: AppPermissionInfo[] = permissionInfos.reduce(
            (acc, info) => acc.concat(this.mapAppPermissions(appPermissions, info)),
            []
        );

        // App-permission table
        await queryRunner.query(this.copyAppPermissionsQuery(newAppPermissions));
    }

	private async migrateApiKeyPermissions(
        queryRunner: QueryRunner,
        ...permissionInfos: PermissionInfo[][]
    ) {
        const apiKeyPermissions: ApiKeyPermissions = await queryRunner.query(`select  "apiKeyId"
,"permissionId"
from public.api_key_permissions_permission`);

        // .reduce instead of .flatmap as it's only available in ES2019+
        const newApiKeyPermissions: ApiKeyPermissionInfo[] = permissionInfos.reduce(
            (acc, info) => acc.concat(this.mapApiKeyPermissions(apiKeyPermissions, info)),
            []
        );

        // ApiKey-permission table
        await queryRunner.query(this.copyApiKeyPermissionsQuery(newApiKeyPermissions));
    }

    private fetchPermissionsIdsQuery(oldType: string, newType = oldType): string {
        return `select "createdAt",
        "updatedAt",
        '${newType}',
        name,
        "automaticallyAddNewApplications",
        "createdById",
        "updatedById",
        "organizationId",
        "id" AS "clonedFromId"
 from "public"."permission"
 where type = '${oldType}'`;
    }

    private copyPermissionsQuery(oldType: string, newType: string): string {
        return `INSERT INTO "public"."permission"("createdAt","updatedAt",type,name,"automaticallyAddNewApplications","createdById","updatedById","organizationId","clonedFromId")
        ${this.fetchPermissionsIdsQuery(oldType, newType)}
returning id, "permission"."clonedFromId"`;
    }

    private mapUserPermissions(
        userPermissions: UserPermissions,
        infos: UserPermissionInfo[]
    ): PermissionInfo[] {
        const mappedInfos = infos.map(info => {
            const match = userPermissions.find(p => p.permissionId === info.clonedFromId);
            return match ? { ...info, userId: match.userId } : info;
        });
        return mappedInfos.filter(info => typeof info.userId === "number");
    }

    private mapAppPermissions(
        appPermissions: AppPermissions,
        infos: AppPermissionInfo[]
    ): PermissionInfo[] {
        const mappedInfos = infos.map(info => {
            const match = appPermissions.find(p => p.permissionId === info.clonedFromId);
            return match ? { ...info, applicationId: match.applicationId } : info;
        });
        return mappedInfos.filter(info => typeof info.applicationId === "number");
    }

	private mapApiKeyPermissions(
        apiKeyPermissions: ApiKeyPermissions,
        infos: ApiKeyPermissionInfo[]
    ): PermissionInfo[] {
        const mappedInfos = infos.map(info => {
            const match = apiKeyPermissions.find(p => p.permissionId === info.clonedFromId);
            return match ? { ...info, apiKeyId: match.apiKeyId } : info;
        });
        return mappedInfos.filter(info => typeof info.apiKeyId === "number");
    }

    private copyUserPermissionsQuery(infos: UserPermissionInfo[]): string {
        if (!infos.length) return "";

        const insertIntoStatements = infos
            .map(info => `(${info.userId}, ${info.id})`)
            .join(",");
        return `INSERT INTO "public"."user_permissions_permission"("userId","permissionId") VALUES
        ${insertIntoStatements}`;
    }

    private copyAppPermissionsQuery(infos: AppPermissionInfo[]): string {
        if (!infos.length) return "";

        const insertIntoStatements = infos
            .map(info => `(${info.applicationId}, ${info.id})`)
            .join(",");
        return `INSERT INTO "public"."application_permissions_permission"("applicationId","permissionId") VALUES
        ${insertIntoStatements}`;
    }

	private copyApiKeyPermissionsQuery(infos: ApiKeyPermissionInfo[]): string {
        if (!infos.length) return "";

        const insertIntoStatements = infos
            .map(info => `(${info.apiKeyId}, ${info.id})`)
            .join(",");
        return `INSERT INTO "public"."api_key_permissions_permission"("apiKeyId","permissionId") VALUES
        ${insertIntoStatements}`;
    }

    private async migratePermissionTypeUp(queryRunner: QueryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_71bf2818fb2ad92e208d7aeadf"`);
        await queryRunner.query(`CREATE TABLE "permission_type" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" character varying NOT NULL, "createdById" integer, "updatedById" integer, "permissionId" integer, CONSTRAINT "PK_3f2a17e0bff1bc4e34254b27d78" PRIMARY KEY ("id"))`);

        const fetchAllPermissions = `select "createdAt",
        "updatedAt",
        type,
        "createdById",
        "updatedById",
        "id" AS "permissionId"
 from "public"."permission"`;

        await queryRunner.query(`INSERT INTO "public"."permission_type"("createdAt","updatedAt",type,"createdById","updatedById","permissionId")
        ${fetchAllPermissions}`);

        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."permission_type_enum"`);
        await queryRunner.query(`ALTER TABLE "permission_type" ADD CONSTRAINT "FK_abd46fe625f90edc07441bd0bb2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permission_type" ADD CONSTRAINT "FK_6ebf76b0f055fe09e42edfe4848" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permission_type" ADD CONSTRAINT "FK_b8613564bc719a6e37ff0ba243b" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    private async migrateDown(queryRunner: QueryRunner): Promise<void> {
        await this.migratePermissionTypeDown(queryRunner);

        // Create a temporary enum which is a union of both old and new enum values
        await queryRunner.query(
            `CREATE TYPE "permission_type_enum_temp" AS ENUM('OrganizationAdmin', 'Write', 'GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`
        );
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_temp" USING "type"::"text"::"permission_type_enum_temp"`
        );

        // When migrating permisisons tied to old permission types, we need to keep track of the old id. This is for updating any dependents
        await queryRunner.query(
            `ALTER TABLE "permission" ADD COLUMN "clonedFromId" integer`
        );

        // Begin cloning. Store both the old and new ids as mappings
        const readFromUserAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationUserAdmin", "Read")
        );
        const readFromGatewayAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationGatewayAdmin", "Read")
        );
        // In every scenario, an application admin has write access
        const writeFromApplicationAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationApplicationAdmin", "Write")
        );
        // Copy to "Read" on the off chance that "Write" isn't treated as a superset of "Read"
        const readFromApplicationAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationApplicationAdmin", "Read")
        );

        // Migrate entities in other tables with a foreign key to the permission table
        await this.migrateUserPermissions(
            queryRunner,
            readFromUserAdminInfo,
            readFromGatewayAdminInfo,
            readFromApplicationAdminInfo,
            writeFromApplicationAdminInfo
        );

        await this.migrateApplicationPermissions(
            queryRunner,
            readFromUserAdminInfo,
            readFromGatewayAdminInfo,
            readFromApplicationAdminInfo,
            writeFromApplicationAdminInfo
        );

        // Cleanup
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "clonedFromId"`);
        await queryRunner.query(
            `DELETE FROM "public"."permission" where type IN ('OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin')`
        );
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_old" USING "type"::"text"::"permission_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "permission_type_enum_temp"`);
    }

    private async migratePermissionTypeDown(queryRunner: QueryRunner) {
        // TODO: Migrate first?

        await queryRunner.query(`ALTER TABLE "permission_type" DROP CONSTRAINT "FK_b8613564bc719a6e37ff0ba243b"`);
        await queryRunner.query(`ALTER TABLE "permission_type" DROP CONSTRAINT "FK_6ebf76b0f055fe09e42edfe4848"`);
        await queryRunner.query(`ALTER TABLE "permission_type" DROP CONSTRAINT "FK_abd46fe625f90edc07441bd0bb2"`);
        await queryRunner.query(`CREATE TYPE "public"."permission_type_enum" AS ENUM('GlobalAdmin', 'OrganizationAdmin', 'Write', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`);
        await queryRunner.query(`ALTER TABLE "permission" ADD "type" "public"."permission_type_enum" NOT NULL`);
        await queryRunner.query(`DROP TABLE "permission_type"`);
        await queryRunner.query(`CREATE INDEX "IDX_71bf2818fb2ad92e208d7aeadf" ON "permission" ("type") `);
    }
}
