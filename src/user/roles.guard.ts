import {
    Injectable,
    CanActivate,
    ExecutionContext,
    Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    private readonly logger = new Logger(RolesGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>(
            "roles",
            context.getHandler()
        );
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        this.logger.log(`User: ${JSON.stringify(user)}`);

        // Does this user have access to this endpoint?

        return true;
    }
}
