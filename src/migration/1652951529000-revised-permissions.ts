import { Application } from "@entities/application.entity";
import { MigrationInterface, QueryRunner } from "typeorm";

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
    userIds?: number[];
};

type AppPermissionInfo = PermissionInfo & {
    applicationIds?: number[];
};

type ApiKeyPermissionInfo = PermissionInfo & {
    apiKeyIds?: number[];
};

type UserPermissions = {
    userId: number;
    permissionId: number;
}[];

/**
 * Create a temporary enum which is a union of both old and new enum values
 */
const permissionTypeUnionName = "permission_type_enum_temp";
const createPermissionTypeUnionSql = `CREATE TYPE "${permissionTypeUnionName}" AS ENUM('OrganizationAdmin', 'Write', 'GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`;

export class revisedPermissions1652951529000 implements MigrationInterface {
    name = "revisedPermissions1652951529000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."permission_type_enum" RENAME TO "permission_type_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "permission_type_enum" AS ENUM('GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read')`
        );
        await queryRunner.query(createPermissionTypeUnionSql);

        // Migrate permission types to the new permission type table without altering them
        await this.migratePermissionTypeUp(queryRunner);
        // Migrate existing data. Old permission levels are updated to the new ones
        await this.migratePermissionUp(queryRunner);

        // Cleanup
        await this.migratePermissionTypeUpCleanup(queryRunner);
        await queryRunner.query(`DROP TYPE "${permissionTypeUnionName}"`);
        await queryRunner.query(`DROP TYPE "permission_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "permission_type_enum_old" AS ENUM('GlobalAdmin', 'OrganizationAdmin', 'Write', 'Read', 'OrganizationPermission', 'OrganizationApplicationPermissions', 'ApiKeyPermission')`
        );
        // Create a temporary enum which is a union of both old and new enum values
        await queryRunner.query(createPermissionTypeUnionSql);

        // Revert permission so each one only has exactly one type (level)
        await this.migratePermissionTypeDown(queryRunner);
        await queryRunner.query(`COMMENT ON COLUMN "permission"."type" IS NULL`);

        // Migrates existing data. This can result in duplicate permissions and duplicates of its dependents
        // ASSUMPTION: this migration is only reverted immediately after executing it.
        // There's no 1-1 translation between the three organization admin permissions and the old ones. Ex. OrganizationGatewayAdmin has no equivalent
        // To avoid elevating users unexpectedly, for security reasons, we translate them to "Read".
        await this.migratePermissionDown(queryRunner);

        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_old" USING "type"::"text"::"permission_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE IF EXISTS "permission_type_enum"`);
        await queryRunner.query(
            `ALTER TYPE "permission_type_enum_old" RENAME TO  "permission_type_enum"`
        );
    }

    private async migratePermissionUp(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "${permissionTypeUnionName}" USING "type"::"text"::"${permissionTypeUnionName}"`
        );

        // Begin migrating to the new permission types.
        await queryRunner.query(
            this.copyPermissionTypeQuery("OrganizationAdmin", "OrganizationUserAdmin")
        );
        await queryRunner.query(
            this.copyPermissionTypeQuery(
                "OrganizationAdmin",
                "OrganizationApplicationAdmin"
            )
        );
        // OrganizationAdmin has access to all applications despite not being mapped.
        // The new system requires an application admin to be mapped to an application to access it
        await this.migrateApplicationsForOrganizationAdminsUp(queryRunner);
        await queryRunner.query(
            this.copyPermissionTypeQuery("OrganizationAdmin", "OrganizationGatewayAdmin")
        );
        await queryRunner.query(
            this.copyPermissionTypeQuery("OrganizationAdmin", "Read")
        );

        await queryRunner.query(
            this.copyPermissionTypeQuery("Write", "OrganizationApplicationAdmin")
        );
        await queryRunner.query(this.copyPermissionTypeQuery("Write", "Read"));
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

    private buildPermissionColumns(newType: string) {
        return `"createdAt",
        "updatedAt",
        '${newType}',
        name,
        "automaticallyAddNewApplications",
        "createdById",
        "updatedById",
        "organizationId"`;
    }

    private buildPermissionColumnsForPermissionType(newType: string) {
        return `"createdAt",
        "updatedAt",
        '${newType}',
        "createdById",
        "updatedById",
        "id"`;
    }

    private fetchPermissionsIdsQuery(oldType: string, newType = oldType): string {
        return `select ${this.buildPermissionColumns(newType)},
            "id" AS "clonedFromId"
     from "public"."permission"
     where type = '${oldType}'`;
    }

    private fetchPermissionsForPermissionTypeQuery(
        oldType: string,
        newType = oldType
    ): string {
        return `select ${this.buildPermissionColumnsForPermissionType(newType)}
    from "public"."permission"
    where type = '${oldType}'`;
    }

    private copyPermissionsQuery(oldType: string, newType: string): string {
        return `INSERT INTO "public"."permission"("createdAt","updatedAt",type,name,"automaticallyAddNewApplications","createdById","updatedById","organizationId","clonedFromId")
            ${this.fetchPermissionsIdsQuery(oldType, newType)}
    returning id, "permission"."clonedFromId"`;
    }

    private copyPermissionTypeQuery(oldType: string, newType: string): string {
        return `INSERT INTO "public"."permission_type"("createdAt","updatedAt",type,"createdById","updatedById","permissionId")
        ${this.fetchPermissionsForPermissionTypeQuery(oldType, newType)}`;
    }

    private mapUserPermissions(
        userPermissions: UserPermissions,
        infos: UserPermissionInfo[]
    ): PermissionInfo[] {
        const mappedInfos = infos.map(info => {
            const matches = userPermissions.filter(
                p => p.permissionId === info.clonedFromId
            );
            return matches.length
                ? { ...info, userIds: matches.map(x => x.userId) }
                : info;
        });
        return mappedInfos.filter(info => info.userIds?.length);
    }

    private mapAppPermissions(
        appPermissions: AppPermissions,
        infos: AppPermissionInfo[]
    ): PermissionInfo[] {
        const mappedInfos = infos.map(info => {
            const matches = appPermissions.filter(
                p => p.permissionId === info.clonedFromId
            );
            return matches.length
                ? { ...info, applicationIds: matches.map(x => x.applicationId) }
                : info;
        });
        return mappedInfos.filter(info => info.applicationIds?.length);
    }

    private mapApiKeyPermissions(
        apiKeyPermissions: ApiKeyPermissions,
        infos: ApiKeyPermissionInfo[]
    ): PermissionInfo[] {
        const mappedInfos = infos.map(info => {
            const matches = apiKeyPermissions.filter(
                p => p.permissionId === info.clonedFromId
            );
            return matches ? { ...info, apiKeyIds: matches.map(x => x.apiKeyId) } : info;
        });
        return mappedInfos.filter(info => info.apiKeyIds?.length);
    }

    private copyUserPermissionsQuery(infos: UserPermissionInfo[]): string {
        if (!infos.length) return "";

        const insertIntoStatements = infos
            .map(info => info.userIds.map(userId => `(${userId}, ${info.id})`))
            .join(",");
        return `INSERT INTO "public"."user_permissions_permission"("userId","permissionId") VALUES
        ${insertIntoStatements}`;
    }

    private copyAppPermissionsQuery(infos: AppPermissionInfo[]): string {
        if (!infos.length) return "";

        const insertIntoStatements = infos
            .map(info => info.applicationIds.map(appId => `(${appId}, ${info.id})`))
            .join(",");
        return `INSERT INTO "public"."application_permissions_permission"("applicationId","permissionId") VALUES
        ${insertIntoStatements}`;
    }

    private copyApiKeyPermissionsQuery(infos: ApiKeyPermissionInfo[]): string {
        if (!infos.length) return "";

        const insertIntoStatements = infos
            .map(info => info.apiKeyIds.map(keyId => `(${keyId}, ${info.id})`))
            .join(",");
        return `INSERT INTO "public"."api_key_permissions_permission"("apiKeyId","permissionId") VALUES
        ${insertIntoStatements}`;
    }

    private async migratePermissionTypeUp(queryRunner: QueryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_71bf2818fb2ad92e208d7aeadf"`);
        await queryRunner.query(
            `CREATE TYPE "public"."permission_type_type_enum" AS ENUM('GlobalAdmin', 'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin', 'Read')`
        );
        await queryRunner.query(
            `CREATE TABLE "permission_type" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" ${permissionTypeUnionName} NOT NULL, "createdById" integer, "updatedById" integer, "permissionId" integer, CONSTRAINT "PK_3f2a17e0bff1bc4e34254b27d78" PRIMARY KEY ("id"))`
        );

        const fetchAllPermissions = `select "createdAt",
        "updatedAt",
        -- Casting from one enum to another requires casting it to text first
        type::text::${permissionTypeUnionName},
        "createdById",
        "updatedById",
        "id" AS "permissionId"
 from "public"."permission"`;

        // For each permission, create a corresponding permission type
        await queryRunner.query(`INSERT INTO "public"."permission_type"("createdAt","updatedAt",type,"createdById","updatedById","permissionId")
        ${fetchAllPermissions}`);
    }

    /**
     * Must be called after migrating 'OrganizationAdmin' but before migrating 'Write'
     * as they both result in 'OrganizationApplicationAdmin'
     * @param queryRunner
     */
    private async migrateApplicationsForOrganizationAdminsUp(queryRunner: QueryRunner) {
        // Get applications not mapped to existing organization admins
        const unmappedApplications: (Application & {
            permissionid: number;
        })[] = await queryRunner.query(`SELECT app.*
        , pm.id as permissionid
        FROM public.application app
        JOIN public.permission pm ON pm."organizationId" = app."belongsToId"
        JOIN public.permission_type pt ON pt."permissionId" = pm.id
        LEFT JOIN public.application_permissions_permission appPm ON appPm."permissionId" = pm."id"
        WHERE pt.type = 'OrganizationApplicationAdmin'
        -- Ignore mapped applications
        AND appPm."applicationId" IS NULL
        AND appPm."permissionId" IS NULL`);

        if (!unmappedApplications.length) return;

        const insertIntoStatements = unmappedApplications
            .map(app => `(${app.id}, ${app.permissionid})`)
            .join(",");
        await queryRunner.query(`INSERT INTO "public"."application_permissions_permission"("applicationId","permissionId") VALUES
        ${insertIntoStatements}`);
    }

    private async migratePermissionTypeUpCleanup(queryRunner: QueryRunner) {
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."permission_type_enum"`);

        await queryRunner.query(
            `DELETE FROM "public"."permission_type" where type IN ('OrganizationAdmin', 'Write')`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" ALTER COLUMN "type" TYPE "permission_type_type_enum" USING "type"::"text"::"permission_type_type_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" ADD CONSTRAINT "FK_abd46fe625f90edc07441bd0bb2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" ADD CONSTRAINT "FK_6ebf76b0f055fe09e42edfe4848" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" ADD CONSTRAINT "FK_b8613564bc719a6e37ff0ba243b" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" ADD CONSTRAINT "UQ_3acd70f5a3895ee2fb92b2a4290" UNIQUE ("type", "permissionId")`
        );
    }

    private async migratePermissionDown(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "${permissionTypeUnionName}" USING "type"::"text"::"${permissionTypeUnionName}"`
        );

        // When migrating permisisons tied to old permission types, we need to keep track of the old id. This is for updating any dependents
        await queryRunner.query(
            `ALTER TABLE "permission" ADD COLUMN "clonedFromId" integer`
        );

        // Begin cloning. Store both the old and new ids as mappings. The clone must not have access to more than the original.
        const readFromUserAdminInfo: PermissionInfo[] = await queryRunner.query(
            this.copyPermissionsQuery("OrganizationUserAdmin", "OrganizationAdmin")
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

        await this.migrateApiKeyPermissions(
            queryRunner,
            readFromUserAdminInfo,
            readFromGatewayAdminInfo,
            readFromApplicationAdminInfo,
            writeFromApplicationAdminInfo
        );

        // Cleanup
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "clonedFromId"`);
        await this.cleanupPermissionRelations(
            queryRunner,
            "'OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin'"
        );

        await queryRunner.query(
            `DELETE FROM "public"."permission" where type IN ('OrganizationUserAdmin', 'OrganizationGatewayAdmin', 'OrganizationApplicationAdmin')`
        );
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum_old" USING "type"::"text"::"permission_type_enum_old"`
        );
        await queryRunner.query(`DROP TYPE "${permissionTypeUnionName}"`);
    }

    private async migratePermissionTypeDown(queryRunner: QueryRunner) {
        await queryRunner.query(
            `ALTER TABLE "permission_type" DROP CONSTRAINT "UQ_3acd70f5a3895ee2fb92b2a4290"`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" DROP CONSTRAINT "FK_b8613564bc719a6e37ff0ba243b"`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" DROP CONSTRAINT "FK_6ebf76b0f055fe09e42edfe4848"`
        );
        await queryRunner.query(
            `ALTER TABLE "permission_type" DROP CONSTRAINT "FK_abd46fe625f90edc07441bd0bb2"`
        );

        // Add permission level "type". It's nullable to make the migration possible
        await queryRunner.query(
            `ALTER TABLE "permission" ADD "type" "${permissionTypeUnionName}"`
        );

        // Temporary table with every permission settable by a client prioritized. Any permission with an unknown type is ignored.
        // Unless otherwise specified, the table is automatically dropped after session end.
        await queryRunner.query(`CREATE TEMP TABLE "permission_type_priority" ON COMMIT DROP AS
        SELECT * FROM (
            VALUES
                ('GlobalAdmin'::text, 0),
                ('OrganizationUserAdmin'::text, 10),
                ('OrganizationApplicationAdmin'::text, 20),
                ('OrganizationGatewayAdmin'::text, 30),
                ('Read'::text, 40)
        ) as t (type, priority)`);

        // Migrate permission levels
        await queryRunner.query(`UPDATE
        public.permission pm
    SET
        -- The column is updated for each row with identical "permissionId"
        -- Casting from one enum to another requires casting it to text first
        type = highestPmType.type::text::${permissionTypeUnionName}
    FROM
    (
        SELECT pt.*
        FROM permission_type_priority ptp
        JOIN permission_type pt ON ptp.type::${permissionTypeUnionName} = pt.type::text::${permissionTypeUnionName}
        -- Order specifically so that the last update, for any permission, is the type
        -- with highest priority (lowest value)
        ORDER BY ptp.priority ASC
    ) highestPmType
    WHERE
        pm.id = highestPmType."permissionId"`);

        // Cleanup. If setting "type" to non-nullable fails, then there exists permissions without any level.
        // This should not happen. Review them manually.
        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" SET NOT NULL`
        );
        await queryRunner.query(`DROP TABLE "permission_type"`);
        await queryRunner.query(`DROP TYPE "public"."permission_type_type_enum"`);
        await queryRunner.query(
            `CREATE INDEX "IDX_71bf2818fb2ad92e208d7aeadf" ON "permission" ("type") `
        );
    }

    private async cleanupPermissionRelations(
        queryRunner: QueryRunner,
        permissionTypesToRemove: string
    ) {
        await queryRunner.query(`DELETE FROM user_permissions_permission
WHERE "permissionId" IN
(
    SELECT "permission"."id" FROM user_permissions_permission
    JOIN permission ON permission.id = "public"."user_permissions_permission"."permissionId"
    WHERE permission.type IN (${permissionTypesToRemove})
);`);

        await queryRunner.query(`DELETE FROM application_permissions_permission
WHERE "permissionId" IN
(
    SELECT "permission"."id" FROM application_permissions_permission
    JOIN permission ON permission.id = "public"."application_permissions_permission"."permissionId"
    WHERE permission.type IN (${permissionTypesToRemove})
)`);

        await queryRunner.query(`DELETE FROM api_key_permissions_permission
WHERE "permissionId" IN
(
    SELECT "permission"."id" FROM api_key_permissions_permission
    JOIN permission ON permission.id = "public"."api_key_permissions_permission"."permissionId"
    WHERE permission.type IN (${permissionTypesToRemove})
)`);
    }
}
