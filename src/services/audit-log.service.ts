import { ActionType, AuditLogEntry } from "@entities/audit-log-entry";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AuditLog {
    static readonly logger = new Logger(AuditLog.name, false);

    static log(
        actionType: ActionType,
        type: string,
        userId: number,
        id: number | string = null,
        name: string = null,
        completed = false
    ): void {
        const auditLogEntry: AuditLogEntry = {
            userId: userId,
            timestamp: new Date(),
            actionType: actionType,
            type: type,
            id: id,
            name: name,
            completed: completed,
        };
        this.logger.log(JSON.stringify(auditLogEntry));
    }

    static success(
        actionType: ActionType,
        type: string,
        userId: number,
        id: number | string = null,
        name: string = null
    ): void {
        this.log(actionType, type, userId, id, name, true);
    }

    static fail(
        actionType: ActionType,
        type: string,
        userId: number,
        id: number | string = null,
        name: string = null
    ): void {
        this.log(actionType, type, userId, id, name, false);
    }
}
