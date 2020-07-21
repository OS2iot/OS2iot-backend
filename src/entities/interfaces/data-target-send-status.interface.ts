import { SendStatus } from "@enum/send-status.enum";

export interface DataTargetSendStatus {
    errorMessage?: string;
    status: SendStatus;
}
