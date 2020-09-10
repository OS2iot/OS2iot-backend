import { RequestHasAtLeastAUser } from "./has-at-least-user";
import { ForbiddenException } from "@nestjs/common";
import * as _ from "lodash";

export function checkIfUserHasWriteAccessToApplication(
    req: RequestHasAtLeastAUser,
    applicationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllApplicationsWithAtLeastWrite(),
        applicationId
    );
}

export function checkIfUserHasReadAccessToApplication(
    req: RequestHasAtLeastAUser,
    applicationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllApplicationsWithAtLeastRead(),
        applicationId
    );
}

export function checkIfUserHasWriteAccessToOrganization(
    req: RequestHasAtLeastAUser,
    organizationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllOrganizationsWithAtLeastWrite(),
        organizationId
    );
}

export function checkIfUserHasAdminAccessToOrganization(
    req: RequestHasAtLeastAUser,
    organizationId: number
): void {
    checkIfGlobalAdminOrInList(
        req,
        req.user.permissions.getAllOrganizationsWithAtLeastAdmin(),
        organizationId
    );
}

function checkIfGlobalAdminOrInList(
    req: RequestHasAtLeastAUser,
    list: number[],
    id: number
): void {
    if (req.user.permissions.isGlobalAdmin) {
        return;
    }

    if (!_.includes(list, id)) {
        throw new ForbiddenException();
    }
}
