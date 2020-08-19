import { Logger } from "@nestjs/common";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { SendStatus } from "@enum/send-status.enum";

/**
 * This class exposes general functionality used for the DataTarget
 */
export abstract class BaseDataTargetService {
    constructor() {
        Logger.debug("Initialized BaseDateTargetService");
    }

    protected abstract logger: Logger;

    success(receiver: string): DataTargetSendStatus {
        this.logger.debug(`Send to ${receiver} sucessful!`);
        return { status: SendStatus.OK };
    }

    failure(receiver: string, errorMessage: string): DataTargetSendStatus {
        this.logger.error(`Send to ${receiver} failed with error ${errorMessage}`);
        return {
            status: SendStatus.ERROR,
            errorMessage: errorMessage.toString(),
        };
    }
}
