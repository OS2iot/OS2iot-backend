import { Logger } from "@nestjs/common";

import { SendStatus } from "@enum/send-status.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { DataTarget } from "@entities/data-target.entity";

/**
 * This class exposes general functionality used for the DataTarget
 */
export abstract class BaseDataTargetService {
    protected readonly baseLogger = new Logger(BaseDataTargetService.name);

    success(receiver: string): DataTargetSendStatus {
        this.baseLogger.debug(`Send to ${receiver} sucessful!`);
        return { status: SendStatus.OK };
    }

    failure(receiver: string, errorMessage: string, dataTarget: DataTarget): DataTargetSendStatus {
        this.baseLogger.error(
            `Datatarget {Id: ${dataTarget.id}, Name: ${dataTarget.name}} Send to ${receiver} failed with error ${errorMessage}`
        );
        return {
            status: SendStatus.ERROR,
            errorMessage: errorMessage.toString(),
        };
    }
}
