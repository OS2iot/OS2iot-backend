import { MqttClientId } from "@config/constants/mqtt-constants";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { MqttDataTargetConfiguration } from "@interfaces/mqtt-data-target-configuration.interface";
import { HttpService, Injectable, Logger } from "@nestjs/common";
import * as mqtt from "mqtt";
import { BaseDataTargetService } from "./base-data-target.service";

@Injectable()
export class MqttDataTargetService extends BaseDataTargetService {
    constructor(private httpService: HttpService) {
        super();
    }

    protected readonly logger = new Logger(MqttDataTargetService.name);

    send(
        datatarget: DataTarget,
        dto: TransformedPayloadDto,
        onDone: (status: DataTargetSendStatus, targetType: DataTargetType) => void
    ): void {
        const config: MqttDataTargetConfiguration = (datatarget as MqttDataTarget).toConfiguration();

        // Setup client
        const client = mqtt.connect(config.url, {
            clean: true,
            clientId: MqttClientId,
            username: config.username,
            password: config.password,
            port: config.port,
            connectTimeout: config.timeout,
        });
        const targetForLogging = `MqttDataTarget(URL '${config.url}', topic '${config.topic}')`;

        client.once("connect", () => {
            client.publish(
                config.topic,
                JSON.stringify(dto.payload),
                { qos: config.qos },
                (err, packet) => {
                    try {
                        if (err) {
                            const status = this.failure(targetForLogging, err?.message);
                            onDone(status, DataTargetType.MQTT);
                        } else {
                            this.logger.debug(
                                "Packet received: " + JSON.stringify(packet)
                            );
                            const status = this.success(targetForLogging);
                            onDone(status, DataTargetType.MQTT);
                        }
                    } finally {
                        client.end();
                    }
                }
            );
        });
    }
}
