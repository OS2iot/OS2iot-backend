import { MqttClientId } from "@config/constants/mqtt-constants";
import { TransformedPayloadDto } from "@dto/kafka/transformed-payload.dto";
import { DataTarget } from "@entities/data-target.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { DataTargetSendStatus } from "@interfaces/data-target-send-status.interface";
import { MqttDataTargetConfiguration } from "@interfaces/mqtt-data-target-configuration.interface";
import { Injectable, Logger } from "@nestjs/common";
import * as mqtt from "mqtt";
import { BaseDataTargetService } from "./base-data-target.service";
import { SendStatus } from "@enum/send-status.enum";

@Injectable()
export class MqttDataTargetService extends BaseDataTargetService {
  protected readonly logger = new Logger(MqttDataTargetService.name);

  constructor() {
    super();
  }

  send(
    datatarget: DataTarget,
    dto: TransformedPayloadDto,
    onDone: (
      status: DataTargetSendStatus,
      targetType: DataTargetType,
      datatarget: DataTarget,
      payloadDto: TransformedPayloadDto
    ) => void,
    onSendError: (
      err: Error,
      targetType: DataTargetType,
      datatarget: DataTarget,
      payloadDto: TransformedPayloadDto
    ) => void
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
      // Accept connection to servers with self-signed certificates
      rejectUnauthorized: false,
    });
    const targetForLogging = `MqttDataTarget(URL '${config.url}', topic '${config.topic}')`;

    client
      .once("connect", () => {
        client.publish(config.topic, JSON.stringify(dto.payload), { qos: config.qos }, (err, packet) => {
          try {
            const responseInfo = this.decodeMqttResponse(packet);
            if (err) {
              const status = this.failure(
                targetForLogging,
                err?.message,
                datatarget,
                responseInfo?.reasonCode,
                responseInfo?.reasonString
              );
              onDone(status, DataTargetType.MQTT, datatarget, dto);
            } else {
              this.logger.debug("Packet received: " + JSON.stringify(packet));
              const status = this.success(targetForLogging, responseInfo?.reasonCode, responseInfo?.reasonString);
              onDone(status, DataTargetType.MQTT, datatarget, dto);
            }
          } finally {
            client.end();
          }
        });
      })
      .once("error", err => onSendError(err, DataTargetType.MQTT, datatarget, dto));
  }

  public async testConnection(datatarget: DataTarget): Promise<DataTargetSendStatus> {
    const config: MqttDataTargetConfiguration = (datatarget as MqttDataTarget).toConfiguration();

    // Setup client
    const client = mqtt.connect(config.url, {
      clean: true,
      clientId: MqttClientId,
      username: config.username,
      password: config.password,
      port: config.port,
      connectTimeout: config.timeout,
      // Accept connection to servers with self-signed certificates
      rejectUnauthorized: false,
    });

    // Sleep for 5 seconds to allow the client to fully connect
    await this.sleep(5000);

    const result: DataTargetSendStatus = client.connected
      ? {
          status: SendStatus.OK,
          statusText: "Connection successful",
        }
      : {
          status: SendStatus.ERROR,
          statusText: "Unable to connect",
        };

    client.end();

    return result;
  }

  private decodeMqttResponse(
    packet: mqtt.Packet | undefined
  ): { reasonString?: string; reasonCode?: number } | undefined {
    // Some of the packet-types have no useful info at all
    if (
      !packet ||
      packet.cmd === "pingreq" ||
      packet.cmd === "pingresp" ||
      packet.cmd === "publish" ||
      packet.cmd === "connect"
    ) {
      return undefined;
    }
    // A few special packets have reason-info other than the reasonString
    if (packet.cmd === "connack") {
      return { reasonCode: packet.reasonCode, reasonString: "" + packet.returnCode };
    }
    // The remaining packet-types (which is most of them) will have the reasonString, and all except 2 will also have reasonCode
    return {
      reasonString: packet.properties?.reasonString,
      reasonCode: packet.cmd !== "subscribe" && packet.cmd !== "unsubscribe" ? packet.reasonCode : undefined,
    };
  }

  private _sleep(ms: number): any {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async sleep(ms: number): Promise<any> {
    await this._sleep(ms);
  }
}
