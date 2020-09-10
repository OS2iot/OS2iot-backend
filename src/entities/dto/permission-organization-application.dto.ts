import * as _ from "lodash";

export class UserPermissions {
    constructor() {
        this.readPermissions = new Map();
        this.writePermissions = new Map();
        this.organizationAdminPermissions = new Set();
    }

    readPermissions: Map<number, number[]>;
    writePermissions: Map<number, number[]>;
    organizationAdminPermissions: Set<number>;
    isGlobalAdmin = false;

    getAllApplicationsWithAtLeastRead(): number[] {
        return _.union(
            this.extractValues(this.readPermissions),
            this.getAllApplicationsWithAtLeastWrite()
        );
    }

    getAllApplicationsWithAtLeastWrite(): number[] {
        return this.extractValues(this.writePermissions);
    }

    getAllOrganizationsWithAtLeastRead(): number[] {
        return _.union(
            this.extractKeys(this.readPermissions),
            this.getAllOrganizationsWithAtLeastWrite()
        );
    }

    getAllOrganizationsWithAtLeastWrite(): number[] {
        return _.union(
            this.extractKeys(this.writePermissions),
            this.getAllOrganizationsWithAtLeastAdmin()
        );
    }

    getAllOrganizationsWithAtLeastAdmin(): number[] {
        return Array.from(this.organizationAdminPermissions);
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
            res.push(key);
        }

        return res;
    }
}
