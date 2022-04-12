import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { MqttDataTargetConfiguration } from "@interfaces/mqtt-data-target-configuration.interface";
import { HttpService, Injectable, Logger, NotImplementedException } from "@nestjs/common";
import { BaseDataTargetService } from "./base-data-target.service";

@Injectable()
export class MqttDataTargetService extends BaseDataTargetService {
    constructor(private httpService: HttpService) {
        super();
    }

    protected readonly logger = new Logger(MqttDataTargetService.name);

    async send(
        datatarget: DataTarget,
        dto: TransformedPayloadDto
    ): Promise<DataTargetSendStatus> {
        const config: MqttDataTargetConfiguration = (datatarget as MqttDataTarget).toConfiguration();

        throw new NotImplementedException();
    }
}
