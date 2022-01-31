import { MigrationInterface, QueryRunner } from "typeorm";

type AppPermissions = {
    applicationId: number;
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

type UserPermissions = {
    userId: number;
    permissionId: number;
}[];

export class RevisedPermissions1643627475551 implements MigrationInterface {
    name = "RevisedPermissions1643627475551";

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

        await queryRunner.query(
            `ALTER TABLE "permission" ALTER COLUMN "type" TYPE "permission_type_enum" USING "type"::"text"::"permission_type_enum"`
        );
        await queryRunner.query(`DROP TYPE "permission_type_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "permission"."type" IS NULL`);
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
        await this.migrateUserPermissions(
            queryRunner,
            applicationAdminFromWriteInfo,
            readFromWriteInfo,
            userAdminFromOrgAdminInfo,
            applicationAdminFromOrgAdminInfo,
            gatewayAdminFromOrgAdminInfo,
            readAdminFromOrgAdminInfo
        );

        await this.migrateApplicationPermissions(
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

        // User-permission table
        await queryRunner.query(this.copyAppPermissionsQuery(newAppPermissions));
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

    private async migrateDown(queryRunner: QueryRunner): Promise<void> {
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
}
