import { SetMetadata } from "@nestjs/common";
import { PermissionType } from "@enum/permission-type.enum";

// export const Roles = (...roles: string[]) => SetMetadata("roles", roles);

export const Read = () => SetMetadata("roles", PermissionType.Read);
export const Write = () => SetMetadata("roles", PermissionType.Write);
export const OrganizationAdmin = () =>
    SetMetadata("roles", PermissionType.OrganizationAdmin);
export const GlobalAdmin = () =>
    SetMetadata("roles", PermissionType.GlobalAdmin);
