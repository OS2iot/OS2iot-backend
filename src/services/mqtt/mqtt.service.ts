import { Injectable } from "@nestjs/common";
import { MQTTBrokerDevice } from "@entities/mqtt-broker-device.entity";
import { random } from "crypto-js/lib-typedarrays";
import { algo, enc, PBKDF2 } from "crypto-js";
import { ApplicationService } from "@services/device-management/application.service";
import { AuthenticationType } from "@enum/authentication-type.enum";

@Injectable()
export class MqttService {
    constructor(private applicationService: ApplicationService) {}

    // TODO: NotYetImplemented
    public async generateCertificate() {
        return "fakeCert";
    }

    public async createTopic(device: MQTTBrokerDevice): Promise<TopicDetails> {
        const application = await this.applicationService.findOneWithOrganisation(
            device.application.id
        );
        const port =
            device.authenticationType === AuthenticationType.PASSWORD ? "8884" : "8885";
        return {
            uRL: `mqtt://${process.env.MQTT_BROKER_HOSTNAME || "localhost"}:${port}`,
            topicName: `devices/${application.belongsTo.id}/${device.application.id}/${device.id}`,
        };
    }

    public hashPassword(password: string) {
        const salt = random(16);
        const iterations = 1000;
        const keySize = 64;

        const hashed = PBKDF2(password, salt, {
            keySize,
            iterations,
            hasher: algo.SHA512,
        });

        return (
            "PBKDF2$sha512$1000$" +
            salt.toString(enc.Base64) +
            "$" +
            hashed.toString(enc.Base64)
        );
    }
}

export interface TopicDetails {
    uRL: string;
    topicName: string;
}
