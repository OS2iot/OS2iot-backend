import * as _ from "lodash";

export class UserPermissions {
    constructor() {
        this.readPermissions = new Map();
        this.writePermissions = new Map();
        this.organizationAdminPermissions = new Map();
        this.globalAdminPermissions = new Map();
    }

    readPermissions: Map<number, number[]>;
    writePermissions: Map<number, number[]>;
    organizationAdminPermissions: Map<number, number[]>;
    globalAdminPermissions: Map<number, number[]>;

    getAllApplicationsWithRead(): number[] {
        // TODO: this ...
        return [];
    }
}
