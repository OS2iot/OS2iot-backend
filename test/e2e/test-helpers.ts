import { getManager } from "typeorm";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { RawRequestDto } from "@dto/kafka/raw-request.dto";
import { KafkaPayload } from "@services/kafka/kafka.message";
import { KafkaTopic } from "@enum/kafka-topic.enum";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { DataTarget } from "@entities/data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { User } from "@entities/user.entity";
import { GlobalAdminPermission } from "@entities/global-admin-permission.entity";
import { Permission } from "@entities/permission.entity";
import { JwtPayloadDto } from "@dto/internal/jwt-payload.dto";
import { JwtService } from "@nestjs/jwt";
import { OrganizationAdminPermission } from "@entities/organization-admin-permission.entity";
import { Organization } from "@entities/organization.entity";
import { ReadPermission } from "@entities/read-permission.entity";
import { WritePermission } from "@entities/write-permission.entity";
import { PermissionType } from "@enum/permission-type.enum";
import { SigFoxDevice } from "@entities/sigfox-device.entity";

export async function clearDatabase(): Promise<void> {
    await getManager().query(
        `DELETE FROM "iot_device_payload_decoder_data_target_connection"; \n` +
            `DELETE FROM "iot_device"; \n` +
            `DELETE FROM "application"; \n` +
            `DELETE FROM "data_target"; \n` +
            `DELETE FROM "received_message"; \n` +
            `DELETE FROM "received_message_metadata";  \n` +
            `DELETE FROM "payload_decoder";  \n` +
            `DELETE FROM "user_permissions_permission";  \n` +
            `DELETE FROM "application_permissions_permission";  \n` +
            `DELETE FROM "user";  \n` +
            `DELETE FROM "permission";  \n` +
            `DELETE FROM "organization";  \n`
    );
}

export function generateValidJwtForUser(user: User): string {
    const jwtService = new JwtService({
        secret: "secretKey-os2iot-secretKey",
        signOptions: { expiresIn: "9h" },
    });
    const payload: JwtPayloadDto = { username: user.email, sub: user.id };
    return jwtService.sign(payload);
}

export function generateGlobalAdminPermission(): GlobalAdminPermission {
    return new GlobalAdminPermission();
}

export async function generateSavedGlobalAdminPermission(): Promise<
    GlobalAdminPermission
> {
    return await getManager().save(generateGlobalAdminPermission());
}

export function generateOrganizationAdminPermission(
    org: Organization
): OrganizationAdminPermission {
    return new OrganizationAdminPermission("E2E Test - Org admin", org);
}

export async function generateSavedOrganizationAdminPermission(
    org: Organization
): Promise<OrganizationAdminPermission> {
    return await getManager().save(generateOrganizationAdminPermission(org));
}

export function generateOrganization(name?: string): Organization {
    const org = new Organization();
    org.name = name ? name : "E2E Test Organization";
    org.applications = [];
    org.payloadDecoders = [];

    const READ_SUFFIX = " - Read";
    const WRITE_SUFFIX = " - Write";
    const ADMIN_SUFFIX = " - OrganizationAdmin";

    const readPermission = new ReadPermission(org.name + READ_SUFFIX, org);
    const writePermission = new WritePermission(org.name + WRITE_SUFFIX, org);
    const adminPermission = new OrganizationAdminPermission(
        org.name + ADMIN_SUFFIX,
        org
    );
    org.permissions = [adminPermission, writePermission, readPermission];

    return org;
}

export async function generateSavedOrganization(
    name?: string
): Promise<Organization> {
    const org = generateOrganization(name);
    const savedOrg = await getManager().save(org);
    await getManager().save(org.permissions);
    return savedOrg;
}

export function generateUser(permissions: Permission[]): User {
    const user = new User();
    user.name = `TestUser${randomMacAddress()}`;
    user.email = `${user.name}@test.test`;
    user.active = true;
    // Password is 'hunter2', but saving the hash since it takes ~100 ms (by design) to generate the hash.
    user.passwordHash =
        "$2a$10$ypJWMZzMokzdq/gaNYsNieDTCjSCYyzpBzEtyqXDd5VVW1STbmXT2";
    user.permissions = permissions;

    return user;
}

export async function generateSavedGlobalAdminUser(): Promise<User> {
    const globalAdmin = await generateSavedGlobalAdminPermission();
    const user = await getManager().save(generateUser([globalAdmin]));

    return user;
}

export async function generateSavedOrganizationAdminUser(
    org: Organization
): Promise<User> {
    let orgAdmin = org.permissions.find(
        x => x.type == PermissionType.OrganizationAdmin
    );
    if (!orgAdmin) {
        orgAdmin = await generateSavedOrganizationAdminPermission(org);
    }
    const user = await getManager().save(generateUser([orgAdmin]));

    return user;
}

export function generateApplication(org?: Organization): Application {
    const app = new Application();
    app.name = "E2E Test Application";
    app.description = "E2E Test Application Description";
    app.iotDevices = [];
    app.dataTargets = [];
    app.belongsTo = org;

    return app;
}

export async function generateSavedApplication(
    org?: Organization
): Promise<Application> {
    let app;
    if (org) {
        app = generateApplication(org);
    } else {
        const org = await generateSavedOrganization();
        app = generateApplication(org);
    }
    return await getManager().save(app);
}

export function generateSigfoxDevice(application: Application): SigFoxDevice {
    const sigFoxDevice = new SigFoxDevice();
    sigFoxDevice.name = "E2E Test SigFox Device";
    sigFoxDevice.application = application;
    sigFoxDevice.deviceId = "B443A5";
    sigFoxDevice.deviceTypeId = "5e74c318aa8aec41f9cc6b8d";
    sigFoxDevice.metadata = JSON.parse('""');

    return sigFoxDevice;
}

export async function generateSavedSigfoxDevice(
    app: Application
): Promise<SigFoxDevice> {
    return await getManager().save(generateSigfoxDevice(app));
}

export function generateIoTDevice(applications: Application): IoTDevice {
    const device = new GenericHTTPDevice();
    device.name = "E2E Test GENERIC HTTP device";
    device.application = applications;
    device.apiKey = "DUMMY-API-KEY";
    device.metadata = JSON.parse('{"some_key": "a_value"}');
    device.id = 1;

    return device;
}

export async function generateSavedIoTDevice(
    applications: Application
): Promise<IoTDevice> {
    return await getManager().save(generateIoTDevice(applications));
}

export function generateLoRaWANDevice(
    applications: Application
): LoRaWANDevice {
    const device = new LoRaWANDevice();
    device.name = "E2E Test LoRaWAN device";
    device.application = applications;
    device.metadata = JSON.parse('{"some_key": "a_value"}');
    device.id = 1;
    device.deviceEUI = "A81758FFFE042E82";

    return device;
}

export async function generateSavedLoRaWANDevice(
    applications: Application
): Promise<LoRaWANDevice> {
    return await getManager().save(generateLoRaWANDevice(applications));
}

export async function generateSavedDataTarget(
    application: Application
): Promise<HttpPushDataTarget> {
    return await getManager().save(generateDataTarget(application));
}

export function generateDataTarget(
    application: Application
): HttpPushDataTarget {
    const dataTarget = new HttpPushDataTarget();
    dataTarget.name = "E2E Test Http Push Data Target";
    dataTarget.url = "https://enwehrrtrqajd1m.m.pipedream.net";
    dataTarget.application = application;
    dataTarget.timeout = 30000;

    return dataTarget;
}

export async function generateSavedConnection(
    iotDevice: IoTDevice,
    dataTarget: DataTarget,
    payloadDecoder?: PayloadDecoder
): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
    const connection = new IoTDevicePayloadDecoderDataTargetConnection();
    connection.dataTarget = dataTarget;
    connection.iotDevices = [iotDevice];
    connection.payloadDecoder = payloadDecoder;
    return await getManager().save(connection);
}

export function generatePayloadDecoder(org?: Organization): PayloadDecoder {
    const decoder = new PayloadDecoder();
    decoder.organization = org;
    decoder.name = "E2E Test Payload Decoder";
    decoder.decodingFunction = `const TYPE_TEMP = 0x01; //temp 2 bytes -3276.8°C -->3276.7°C
    const TYPE_RH = 0x02; //Humidity 1 byte  0-100%
    const TYPE_ACC = 0x03; //acceleration 3 bytes X,Y,Z -128 --> 127 +/-63=1G
    const TYPE_LIGHT = 0x04; //Light 2 bytes 0-->65535 Lux
    const TYPE_MOTION = 0x05; //No of motion 1 byte  0-255
    const TYPE_CO2 = 0x06; //Co2 2 bytes 0-65535 ppm
    const TYPE_VDD = 0x07; //VDD 2byte 0-65535mV
    const TYPE_ANALOG1 = 0x08; //VDD 2byte 0-65535mV
    const TYPE_GPS = 0x09; //3bytes lat 3bytes long binary
    const TYPE_PULSE1 = 0x0a; //2bytes relative pulse count
    const TYPE_PULSE1_ABS = 0x0b; //4bytes no 0->0xFFFFFFFF
    const TYPE_EXT_TEMP1 = 0x0c; //2bytes -3276.5C-->3276.5C
    const TYPE_EXT_DIGITAL = 0x0d; //1bytes value 1 or 0
    const TYPE_EXT_DISTANCE = 0x0e; //2bytes distance in mm
    const TYPE_ACC_MOTION = 0x0f; //1byte number of vibration/motion
    const TYPE_IR_TEMP = 0x10; //2bytes internal temp 2bytes external temp -3276.5C-->3276.5C
    const TYPE_OCCUPANCY = 0x11; //1byte data
    const TYPE_WATERLEAK = 0x12; //1byte data 0-255
    const TYPE_GRIDEYE = 0x13; //65byte temperature data 1byte ref+64byte external temp
    const TYPE_PRESSURE = 0x14; //4byte pressure data (hPa)
    const TYPE_SOUND = 0x15; //2byte sound data (peak/avg)
    const TYPE_PULSE2 = 0x16; //2bytes 0-->0xFFFF
    const TYPE_PULSE2_ABS = 0x17; //4bytes no 0->0xFFFFFFFF
    const TYPE_ANALOG2 = 0x18; //2bytes voltage in mV
    const TYPE_EXT_TEMP2 = 0x19; //2bytes -3276.5C-->3276.5C
    const TYPE_EXT_DIGITAL2 = 0x1a; // 1bytes value 1 or 0
    const TYPE_EXT_ANALOG_UV = 0x1b; // 4 bytes signed int (uV)
    const TYPE_DEBUG = 0x3d; // 4bytes debug
    
    function bin16dec(bin) {
      var num = bin & 0xffff;
      if (0x8000 & num) num = -(0x010000 - num);
      return num;
    }
    
    function bin8dec(bin) {
      var num = bin & 0xff;
      if (0x80 & num) num = -(0x0100 - num);
      return num;
    }
    
    function base64ToBytes(str) {
      return atob(str)
        .split("")
        .map(function (c) {
          return c.charCodeAt(0);
        });
    }
    
    function hexToBytes(hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    }
    
    function DecodeElsysPayload(data) {
      var obj = new Object();
      for (i = 0; i < data.length; i++) {
        console.log(data[i]);
        switch (data[i]) {
          case TYPE_TEMP: //Temperature
            var temp = (data[i + 1] << 8) | data[i + 2];
            temp = bin16dec(temp);
            obj.temperature = temp / 10;
            i += 2;
            break;
          case TYPE_RH: //Humidity
            var rh = data[i + 1];
            obj.humidity = rh;
            i += 1;
            break;
          case TYPE_ACC: //Acceleration
            obj.x = bin8dec(data[i + 1]);
            obj.y = bin8dec(data[i + 2]);
            obj.z = bin8dec(data[i + 3]);
            i += 3;
            break;
          case TYPE_LIGHT: //Light
            obj.light = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_MOTION: //Motion sensor(PIR)
            obj.motion = data[i + 1];
            i += 1;
            break;
          case TYPE_CO2: //CO2
            obj.co2 = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_VDD: //Battery level
            obj.vdd = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_ANALOG1: //Analog input 1
            obj.analog1 = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_GPS: //gps
            i++;
            obj.lat =
              (data[i + 0] |
                (data[i + 1] << 8) |
                (data[i + 2] << 16) |
                (data[i + 2] & 0x80 ? 0xff << 24 : 0)) /
              10000;
            obj.long =
              (data[i + 3] |
                (data[i + 4] << 8) |
                (data[i + 5] << 16) |
                (data[i + 5] & 0x80 ? 0xff << 24 : 0)) /
              10000;
            i += 5;
            break;
          case TYPE_PULSE1: //Pulse input 1
            obj.pulse1 = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_PULSE1_ABS: //Pulse input 1 absolute value
            var pulseAbs =
              (data[i + 1] << 24) |
              (data[i + 2] << 16) |
              (data[i + 3] << 8) |
              data[i + 4];
            obj.pulseAbs = pulseAbs;
            i += 4;
            break;
          case TYPE_EXT_TEMP1: //External temp
            var temp = (data[i + 1] << 8) | data[i + 2];
            temp = bin16dec(temp);
            obj.externalTemperature = temp / 10;
            i += 2;
            break;
          case TYPE_EXT_DIGITAL: //Digital input
            obj.digital = data[i + 1];
            i += 1;
            break;
          case TYPE_EXT_DISTANCE: //Distance sensor input
            obj.distance = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_ACC_MOTION: //Acc motion
            obj.accMotion = data[i + 1];
            i += 1;
            break;
          case TYPE_IR_TEMP: //IR temperature
            var iTemp = (data[i + 1] << 8) | data[i + 2];
            iTemp = bin16dec(iTemp);
            var eTemp = (data[i + 3] << 8) | data[i + 4];
            eTemp = bin16dec(eTemp);
            obj.irInternalTemperature = iTemp / 10;
            obj.irExternalTemperature = eTemp / 10;
            i += 4;
            break;
          case TYPE_OCCUPANCY: //Body occupancy
            obj.occupancy = data[i + 1];
            i += 1;
            break;
          case TYPE_WATERLEAK: //Water leak
            obj.waterleak = data[i + 1];
            i += 1;
            break;
          case TYPE_GRIDEYE: //Grideye data
            var ref = data[i + 1];
            i++;
            obj.grideye = [];
            for (var j = 0; j < 64; j++) {
              obj.grideye[j] = ref + data[1 + i + j] / 10.0;
            }
            i += 64;
            break;
          case TYPE_PRESSURE: //External Pressure
            var temp =
              (data[i + 1] << 24) |
              (data[i + 2] << 16) |
              (data[i + 3] << 8) |
              data[i + 4];
            obj.pressure = temp / 1000;
            i += 4;
            break;
          case TYPE_SOUND: //Sound
            obj.soundPeak = data[i + 1];
            obj.soundAvg = data[i + 2];
            i += 2;
            break;
          case TYPE_PULSE2: //Pulse 2
            obj.pulse2 = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_PULSE2_ABS: //Pulse input 2 absolute value
            obj.pulseAbs2 =
              (data[i + 1] << 24) |
              (data[i + 2] << 16) |
              (data[i + 3] << 8) |
              data[i + 4];
            i += 4;
            break;
          case TYPE_ANALOG2: //Analog input 2
            obj.analog2 = (data[i + 1] << 8) | data[i + 2];
            i += 2;
            break;
          case TYPE_EXT_TEMP2: //External temp 2
            var temp = (data[i + 1] << 8) | data[i + 2];
            temp = bin16dec(temp);
            if (typeof obj.externalTemperature2 === "number") {
              obj.externalTemperature2 = [obj.externalTemperature2];
            }
            if (typeof obj.externalTemperature2 === "object") {
              obj.externalTemperature2.push(temp / 10);
            } else {
              obj.externalTemperature2 = temp / 10;
            }
            i += 2;
            break;
          case TYPE_EXT_DIGITAL2: //Digital input 2
            obj.digital2 = data[i + 1];
            i += 1;
            break;
          case TYPE_EXT_ANALOG_UV: //Load cell analog uV
            obj.analogUv =
              (data[i + 1] << 24) |
              (data[i + 2] << 16) |
              (data[i + 3] << 8) |
              data[i + 4];
            i += 4;
            break;
          default:
            //somthing is wrong with data
            i = data.length;
            break;
        }
      }
      return obj;
    }
    
    function decode(payload, metadata) {
      let res = {};
      res.decoded = DecodeElsysPayload(base64ToBytes(payload.data));
      return res;
    }
    `;

    return decoder;
}

export async function generateSavedPayloadDecoder(
    org?: Organization
): Promise<PayloadDecoder> {
    const decoder = generatePayloadDecoder(org);
    return await getManager().save(decoder);
}

export function generateLoRaWANRawRequestDto(
    iotDeviceId?: number
): RawRequestDto {
    return {
        rawPayload: JSON.parse(`{
            "data": "AQEXAjEEAIsFCAcOPQ==",
            "freq": 867100000,
            "chan": 3,
            "tmst": 71333956,
            "utmms": 1597675976328,
            "rfch": 0,
            "stat": 1,
            "rssi": -39,
            "size": 26,
            "modu": "LORA",
            "datr": "SF12BW125",
            "codr": "4/5",
            "lsnr": 12
        }`),
        iotDeviceId: iotDeviceId || 1,
        unixTimestamp: 1596921546,
    };
}

export const SIGFOX_PAYLOAD_2 = `{
  "time": 1600674364,
  "deviceTypeId": "5e74c318aa8aec41f9cc6b8d",
  "deviceId": "B443A5",
  "snr": 6.00,
  "rssi": -128.00,
  "station": "93CF",
  "data": "ce20000046003f0f8004223c",
  "seqNumber": 49
  }`;

export const SIGFOX_PAYLOAD = `{
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
            }`;

export function generateSigfoxRawRequestDto(
    iotDeviceId?: number
): RawRequestDto {
    return {
        rawPayload: JSON.parse(SIGFOX_PAYLOAD),
        iotDeviceId: iotDeviceId || 1,
        unixTimestamp: 1596721546,
    };
}

export function generateRawRequestSigfoxKafkaPayload(
    iotDeviceId?: number
): KafkaPayload {
    return {
        body: generateSigfoxRawRequestDto(iotDeviceId),
        messageId: "genericHttp1596721546",
        messageType: "receiveData.genericHttp",
        topicName: KafkaTopic.RAW_REQUEST,
    };
}

export function generateRawRequestLoRaWANKafkaPayload(
    iotDeviceId?: number
): KafkaPayload {
    return {
        body: generateLoRaWANRawRequestDto(iotDeviceId),
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

function randomMacAddress(): string {
    const n = Math.floor(Math.random() * 0xffffff * 100000).toString(16);
    return n.padStart(16, "0");
}
