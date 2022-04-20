/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { PermissionType } from "@enum/permission-type.enum";
import { SetMetadata } from "@nestjs/common";
import { RolesMetaData } from "./constants";

export const Read = () => SetMetadata(RolesMetaData, PermissionType.Read);
export const Write = () => SetMetadata(RolesMetaData, PermissionType.Write);
export const OrganizationAdmin = () =>
    SetMetadata(RolesMetaData, PermissionType.OrganizationAdmin);
export const GlobalAdmin = () => SetMetadata(RolesMetaData, PermissionType.GlobalAdmin);
