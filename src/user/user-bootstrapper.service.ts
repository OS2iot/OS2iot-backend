import { OnModuleInit, Logger, Inject, forwardRef } from "@nestjs/common";
import { UserService } from "./user.service";
import { PermissionService } from "../permission/permission.service";

export class UserBootstrapperService implements OnModuleInit {
    constructor(
        private userService: UserService,
        @Inject(forwardRef(() => PermissionService))
        private permissionService: PermissionService
    ) {}
    private readonly logger = new Logger(UserBootstrapperService.name);

    GLOBAL_ADMIN_EMAIL = "global-admin@os2iot.dk";
    GLOBAL_ADMIN_NAME = "GlobalAdmin";
    GLOBAL_ADMIN_DEFAULT_PASSWORD = "hunter2";

    async onModuleInit(): Promise<void> {
        if (this.userService.isEmailUsedByAUser(this.GLOBAL_ADMIN_EMAIL)) {
            this.logger.debug("GlobalAdmin user already exists. Won't create a new one.");
            return;
        }

        const globalAdminUser = await this.userService.createUser({
            email: this.GLOBAL_ADMIN_EMAIL,
            name: this.GLOBAL_ADMIN_NAME,
            password: this.GLOBAL_ADMIN_DEFAULT_PASSWORD,
            active: true,
        });
        this.logger.log(
            `Created GlobalAdmin user with login - E-mail: '${this.GLOBAL_ADMIN_EMAIL}' - Password: '${this.GLOBAL_ADMIN_DEFAULT_PASSWORD}'`
        );

        const globalAdminPermission = await this.permissionService.findOrCreateGlobalAdminPermission();
        this.permissionService.addUsersToPermission(globalAdminPermission, [
            globalAdminUser,
        ]);
    }
}
