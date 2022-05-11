/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { PermissionType } from "@enum/permission-type.enum";
import { SetMetadata } from "@nestjs/common";
import { RolesMetaData } from "./constants";

export const Read = () => SetMetadata(RolesMetaData, PermissionType.Read);
export const UserAdmin = () => SetMetadata(RolesMetaData, PermissionType.OrganizationUserAdmin);
export const GatewayAdmin = () => SetMetadata(RolesMetaData, PermissionType.OrganizationGatewayAdmin);
export const ApplicationAdmin = () => SetMetadata(RolesMetaData, PermissionType.OrganizationApplicationAdmin);
export const GlobalAdmin = () => SetMetadata(RolesMetaData, PermissionType.GlobalAdmin);
