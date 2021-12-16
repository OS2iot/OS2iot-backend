/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { SetMetadata } from "@nestjs/common";

import { PermissionType } from "@enum/permission-type.enum";

export const Read = () => SetMetadata("roles", PermissionType.Read);
export const UserAdmin = () => SetMetadata("roles", PermissionType.OrganizationUserAdmin);
export const GatewayAdmin = () => SetMetadata("roles", PermissionType.OrganizationGatewayAdmin);
export const ApplicationAdmin = () => SetMetadata("roles", PermissionType.OrganizationApplicationAdmin);
export const GlobalAdmin = () => SetMetadata("roles", PermissionType.GlobalAdmin);
