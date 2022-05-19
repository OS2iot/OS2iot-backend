import * as _ from "lodash";

export class UserPermissions {
    constructor() {
        this.orgToReadPermissions = new Map();
        this.orgToUserAdminPermissions = new Set();
        this.orgToGatewayAdminPermissions = new Set();
        this.orgToApplicationAdminPermissions = new Map();
    }

    orgToReadPermissions: Map<number, number[]>;
    orgToUserAdminPermissions: Set<number>;
    orgToGatewayAdminPermissions: Set<number>;
    orgToApplicationAdminPermissions: Map<number, number[]>;
    isGlobalAdmin = false;

    getAllApplicationsWithAtLeastRead(): number[] {
        return _.union(
            this.extractValues(this.orgToReadPermissions),
            this.getAllApplicationsWithAdmin()
        );
    }

    getAllApplicationsWithAdmin(): number[] {
        return this.extractValues(this.orgToApplicationAdminPermissions);
    }

    getAllOrganizationsWithAtLeastUserAdminRead(): number[] {
        return _.union(
            this.extractKeys(this.orgToReadPermissions),
            this.getAllOrganizationsWithUserAdmin()
        );
    }

    getAllOrganizationsWithAtLeastApplicationRead(): number[] {
        return _.union(
            this.extractKeys(this.orgToReadPermissions),
            this.getAllOrganizationsWithApplicationAdmin()
        );
    }

    getAllOrganizationsWithUserAdmin(): number[] {
        return Array.from(this.orgToUserAdminPermissions);
    }

    getAllOrganizationsWithGatewayAdmin(): number[] {
        return Array.from(this.orgToGatewayAdminPermissions);
    }

    getAllOrganizationsWithApplicationAdmin(): number[] {
        return this.extractKeys(this.orgToApplicationAdminPermissions);
    }

    private extractValues(map: Map<number, number[]>): number[] {
        let res: number[] = [];

        map.forEach(val => {
            res = _.union(res, val);
        });

        return res;
    }

    private extractKeys(map: Map<number, number[]>): number[] {
        const res: number[] = [];

        for (const key of map.keys()) {
            res.push(+key);
        }

        return res;
    }
}
