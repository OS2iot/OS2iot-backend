import { getManager } from "typeorm";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { RawRequestDto } from "@entities/dto/kafka/raw-request.dto";
import { KafkaPayload } from "../../src/services/kafka/kafka.message";
import { KafkaTopic } from "../../src/entities/enum/kafka-topic.enum";
import { ChirpstackSetupNetworkServerService } from "../../src/services/chirpstack/network-server.service";

export async function clearDatabase(): Promise<void> {
    await getManager().query(
        `DELETE FROM "iot_device"; \n` +
            `DELETE FROM "application"; \n` +
            `DELETE FROM "data_target"; \n` +
            `DELETE FROM "received_message"; \n` +
            `DELETE FROM "received_message_metadata";`
    );
}

export function generateApplication(): Application {
    const app = new Application();
    app.name = "E2E Test Application";
    app.description = "E2E Test Application Description";
    app.iotDevices = [];
    app.dataTargets = [];

    return app;
}

export async function generateSavedApplication(): Promise<Application> {
    return await getManager().save(generateApplication());
}

export function generateIoTDevice(applications: Application): IoTDevice {
    const device = new GenericHTTPDevice();
    device.name = "E2E Test GENERIC HTTP device";
    device.application = applications;
    device.apiKey = "DUMMY-API-KEY";
    device.metadata = JSON.parse('{"some_key": "a_value"}');

    return device;
}

export async function generateSavedIoTDevice(
    applications: Application
): Promise<IoTDevice> {
    return await getManager().save(generateIoTDevice(applications));
}

export function generateSigfoxRawRequstDto(
    iotDeviceId?: number
): RawRequestDto {
    return {
        rawPayload: JSON.parse(`{
                "data": "c6099764",
                "sigfoxId": "B445A9",
                "time": "1596721546",
                "snr": "12.53",
                "rssi": "-123.00",
                "avgSnr": "null",
                "station": "37FF",
                "seqNumber": "1",
                "latStation": "null",
                "lngStation": "null",
                "ack": "false"
            }`),
        iotDeviceId: iotDeviceId || 1,
        unixTimestamp: 1596721546,
    };
}

export function generateRawRequestKafkaPayload(
    iotDeviceId?: number
): KafkaPayload {
    return {
        body: generateSigfoxRawRequstDto(iotDeviceId),
        messageId: "genericHttp1596721546",
        messageType: "receiveData.genericHttp",
        topicName: KafkaTopic.RAW_REQUEST,
    };
}

export async function getNetworkServerId(
    chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService
): Promise<string> {
    let id: string;
    await chirpstackSetupNetworkServerService
        .getNetworkServers(1000, 0)
        .then(response => {
            response.result.forEach(element => {
                if (element.name === "OS2iot") {
                    id = element.id.toString();
                }
            });
        });
    return id;
}
