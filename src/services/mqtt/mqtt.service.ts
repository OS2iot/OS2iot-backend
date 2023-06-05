import { Injectable } from "@nestjs/common";
import { MQTTInternalBrokerDevice } from "@entities/mqtt-internal-broker-device.entity";
import { random } from "crypto-js/lib-typedarrays";
import { algo, enc, PBKDF2 } from "crypto-js";
import { ApplicationService } from "@services/device-management/application.service";
import { AuthenticationType } from "@enum/authentication-type.enum";
import * as fs from "fs";
import { createCertificate, createCSR, createPrivateKey } from "pem";
import { caCertPath, caKeyPath } from "@resources/resource-paths";

@Injectable()
export class MqttService {
    constructor(private applicationService: ApplicationService) {}

    public async generateCertificate(deviceName: string): Promise<CertificateDetails> {
        const certificateDetails = new CertificateDetails();
        try {
            createPrivateKey(2048, (err, { key }) => {
                if (err) {
                    console.log("keyerr", err);
                    return;
                }
                certificateDetails.deviceCertificateKey = key;
                createCSR(
                    {
                        commonName: deviceName,
                        clientKey: key,
                    },
                    function (err, { csr }) {
                        if (err) throw err;
                        const caCert = fs.readFileSync(caCertPath);
                        const caKey = fs.readFileSync(caKeyPath).toString();
                        createCertificate(
                            {
                                csr: csr,
                                serviceKey: caKey,
                                serviceCertificate: caCert,
                                serial: Date.now(),
                                days: 365,
                                serviceKeyPassword:
                                    process.env.CA_KEY_PASSWORD || "os2iot",
                            },
                            async function (err, cert) {
                                if (err) throw err;

                                certificateDetails.deviceCertificate = cert.certificate;
                                certificateDetails.ca = caCert.toString();
                            }
                        );
                    }
                );
            });

            // createPrivateKey function behaves like an async function, but cannot be awaited. This ensures waiting till it's done
            while (certificateDetails.deviceCertificate === undefined) {
                const wait = new Promise(resolve => setTimeout(resolve, 100));
                await wait;
            }
            return certificateDetails;
        } catch (err) {
            console.error(err);
        }
    }

    public async createTopic(device: MQTTInternalBrokerDevice): Promise<TopicDetails> {
        const application = await this.applicationService.findOneWithOrganisation(
            device.application.id
        );
        const port =
            device.authenticationType === AuthenticationType.PASSWORD ? "8885" : "8884";
        return {
            uRL: `mqtts://${process.env.MQTT_BROKER_HOSTNAME || "localhost"}`,
            topicName: `devices/${application.belongsTo.id}/${device.application.id}/${device.id}`,
            port: Number(port),
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
    port: number;
}

class CertificateDetails {
    ca: string;
    deviceCertificate: string;
    deviceCertificateKey: string;
}
