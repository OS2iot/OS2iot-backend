import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";
import { Permission } from "@entities/permissions/permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { ForbiddenException, BadRequestException } from "@nestjs/common";
import * as _ from "lodash";
import { PermissionTypeEntity } from "@entities/permissions/permission-type.entity";
import { User } from "@entities/user.entity";

export enum OrganizationAccessScope {
  ApplicationRead,
  ApplicationWrite,
  GatewayWrite,
  UserAdministrationRead,
  UserAdministrationWrite,
}

export enum ApplicationAccessScope {
  Read,
  Write,
}

export function checkIfUserHasAccessToOrganization(
  req: AuthenticatedRequest,
  organizationId: number,
  scope: OrganizationAccessScope
): void {
  if (!Number.isInteger(+organizationId)) return;

  let allowedOrganizations: number[] = [];

  switch (scope) {
    case OrganizationAccessScope.ApplicationRead:
      allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastApplicationRead();
      break;
    case OrganizationAccessScope.ApplicationWrite:
      allowedOrganizations = req.user.permissions.getAllOrganizationsWithApplicationAdmin();
      break;
    case OrganizationAccessScope.GatewayWrite:
      allowedOrganizations = req.user.permissions.getAllOrganizationsWithGatewayAdmin();
      break;
    case OrganizationAccessScope.UserAdministrationRead:
      allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastUserAdminRead();
      break;
    case OrganizationAccessScope.UserAdministrationWrite:
      allowedOrganizations = req.user.permissions.getAllOrganizationsWithUserAdmin();
      break;
    default:
      // Should never happen
      throw new BadRequestException("Bad organization access scope");
  }

  checkIfGlobalAdminOrInList(req, allowedOrganizations, organizationId);
}

export function checkIfUserHasAccessToApplication(
  req: AuthenticatedRequest,
  applicationId: number,
  scope: ApplicationAccessScope
): void {
  if (!Number.isInteger(applicationId)) return;

  let allowedOrganizations: number[] = [];

  switch (scope) {
    case ApplicationAccessScope.Read:
      allowedOrganizations = req.user.permissions.getAllApplicationsWithAtLeastRead();
      break;
    case ApplicationAccessScope.Write:
      allowedOrganizations = req.user.permissions.getAllApplicationsWithAdmin();
      break;
    default:
      // Should never happen
      throw new BadRequestException("Bad application access scope");
  }

  checkIfGlobalAdminOrInList(req, allowedOrganizations, applicationId);
}

export function checkIfUserHasAccessToUser(req: AuthenticatedRequest, user: User) {
  const orgs = req.user.permissions.getAllOrganizationsWithAtLeastUserAdminRead();

  const hasAccess = user.permissions.some(perm => orgs.includes(perm.organization?.id));

  if (!hasAccess && !req.user.permissions.isGlobalAdmin) {
    throw new ForbiddenException();
  }
}

export function checkIfUserIsGlobalAdmin(req: AuthenticatedRequest): void {
  if (!req.user.permissions.isGlobalAdmin) {
    throw new ForbiddenException();
  }
}

function checkIfGlobalAdminOrInList(req: AuthenticatedRequest, list: number[], id: number): void {
  if (req.user.permissions.isGlobalAdmin) {
    return;
  }

  if (!_.includes(list, +id)) {
    throw new ForbiddenException();
  }
}

export function isOrganizationPermission(p: Permission): p is Permission {
  return [
    PermissionType.OrganizationUserAdmin,
    PermissionType.OrganizationApplicationAdmin,
    PermissionType.OrganizationGatewayAdmin,
    PermissionType.Read,
  ].some(orgPermission => p.type.some(({ type }) => type === orgPermission));
}

export function isOrganizationApplicationPermission(p: { type: PermissionTypeEntity[] }): p is Permission {
  return p.type.some(
    ({ type }) => type === PermissionType.Read || type === PermissionType.OrganizationApplicationAdmin
  );
}

export function isPermissionType(
  p: {
    type: PermissionTypeEntity[];
  },
  targetType: PermissionType
): p is Permission {
  return p.type.some(({ type }) => type === targetType);
}
