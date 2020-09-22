import { Inject, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { UserService } from "./user.service";

export class UserBootstrapperService implements OnApplicationBootstrap {
    constructor(
        @Inject(UserService)
        private userService: UserService
    ) {}

    private readonly logger = new Logger(UserBootstrapperService.name);

    GLOBAL_ADMIN_EMAIL = "global-admin@os2iot.dk";
    GLOBAL_ADMIN_NAME = "GlobalAdmin";
    GLOBAL_ADMIN_DEFAULT_PASSWORD = "hunter2";

    async onApplicationBootstrap(): Promise<void> {
        if (
            await this.userService.isEmailUsedByAUser(this.GLOBAL_ADMIN_EMAIL)
        ) {
            this.logger.debug(
                "GlobalAdmin user already exists. Won't create a new one."
            );
            return;
        }

        await this.userService.createUser({
            email: this.GLOBAL_ADMIN_EMAIL,
            name: this.GLOBAL_ADMIN_NAME,
            password: this.GLOBAL_ADMIN_DEFAULT_PASSWORD,
            active: true,
            globalAdmin: true,
        });
        this.logger.log(
            `Created GlobalAdmin user with login - E-mail: '${this.GLOBAL_ADMIN_EMAIL}' - Password: '${this.GLOBAL_ADMIN_DEFAULT_PASSWORD}'`
        );
    }
}
