import { ForbiddenException } from "@nestjs/common";
import * as _ from "lodash";

import { AuthenticatedRequest } from "@entities/dto/internal/authenticated-request";

export function checkIfUserHasWriteAccessToApplication(
    req: AuthenticatedRequest,
    applicationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllApplicationsWithAtLeastWrite(),
        applicationId
    );
}

export function checkIfUserHasReadAccessToApplication(
    req: AuthenticatedRequest,
    applicationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllApplicationsWithAtLeastRead(),
        applicationId
    );
}

export function checkIfUserHasReadAccessToOrganization(
    req: AuthenticatedRequest,
    organizationId: number
): void {
    if (organizationId != null) {
        checkIfGlobalAdminOrInList(
            req,
            req.user.permissions.getAllOrganizationsWithAtLeastRead(),
            organizationId
        );
    }
}

export function checkIfUserHasWriteAccessToOrganization(
    req: AuthenticatedRequest,
    organizationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllOrganizationsWithAtLeastWrite(),
        organizationId
    );
}

export function checkIfUserHasAdminAccessToOrganization(
    req: AuthenticatedRequest,
    organizationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllOrganizationsWithAtLeastAdmin(),
        organizationId
    );
}

export function checkIfUserIsGlobalAdmin(req: AuthenticatedRequest): void {
    if (!req.user.permissions.isGlobalAdmin) {
        throw new ForbiddenException();
    }
}

function checkIfGlobalAdminOrInList(
    req: AuthenticatedRequest,
    list: number[],
    id: number
): void {
    if (req.user.permissions.isGlobalAdmin) {
        return;
    }

    if (!_.includes(list, +id)) {
        throw new ForbiddenException();
    }
}
