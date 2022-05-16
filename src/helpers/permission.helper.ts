import { Organization } from "@entities/organization.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { PermissionTypeEntity } from "@entities/permissions/permission-type.entity";

export abstract class PermissionCreator {
    private static create(
        name: string,
        org?: Organization,
        addNewApps = false
    ): Permission {
        const pm = new Permission(name, org, addNewApps);
        return pm;
    }

    static createByTypes(
        name: string,
        types: PermissionType[],
        org?: Organization,
        addNewApps = false
    ): Permission {
        const pm = new Permission(name, org, addNewApps);
        pm.type = types.map(type => {
            const entity = new PermissionTypeEntity();
            entity.type = type;
            return entity;
        });
        return pm;
    }

    static createGlobalAdmin(): Permission {
        const pm = this.create("GlobalAdmin");
        // TODO: Does this auto-fill dates etc.
        pm.type = [{ type: PermissionType.GlobalAdmin } as PermissionTypeEntity];
        return pm;
    }

    static createRead(name: string, org?: Organization, addNewApps = false): Permission {
        const pm = this.create(name, org, addNewApps);

        // TODO: Does this auto-fill dates etc.
        pm.type = [{ type: PermissionType.Read } as PermissionTypeEntity];
        return pm;
    }

    static createApplicationAdmin(
        name: string,
        org?: Organization,
        addNewApps = false
    ): Permission {
        const pm = this.create(name, org, addNewApps);

        // TODO: Does this auto-fill dates etc.
        pm.type = [
            { type: PermissionType.OrganizationApplicationAdmin } as PermissionTypeEntity,
        ];
        return pm;
    }

    static createUserAdmin(
        name: string,
        org?: Organization,
        addNewApps = false
    ): Permission {
        const pm = this.create(name, org, addNewApps);

        // TODO: Does this auto-fill dates etc.
        pm.type = [
            { type: PermissionType.OrganizationUserAdmin } as PermissionTypeEntity,
        ];
        return pm;
    }

    static createGatewayAdmin(
        name: string,
        org?: Organization,
        addNewApps = false
    ): Permission {
        const pm = this.create(name, org, addNewApps);

        // TODO: Does this auto-fill dates etc.
        pm.type = [
            { type: PermissionType.OrganizationGatewayAdmin } as PermissionTypeEntity,
        ];
        return pm;
    }
}
