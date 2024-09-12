import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Application } from "@entities/application.entity";
import { DataTarget } from "@entities/data-target.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { Organization } from "@entities/organization.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { ReceivedMessage } from "@entities/received-message.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { User } from "@entities/user.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { AuditLog } from "@services/audit-log.service";
import { ApiKey } from "@entities/api-key.entity";
import { Multicast } from "@entities/multicast.entity";
import { LorawanMulticastDefinition } from "@entities/lorawan-multicast.entity";
import { ControlledProperty } from "@entities/controlled-property.entity";
import { ApplicationDeviceType } from "@entities/application-device-type.entity";
import { ReceivedMessageSigFoxSignals } from "@entities/received-message-sigfox-signals.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { PermissionTypeEntity } from "@entities/permissions/permission-type.entity";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";
import { OpenDataDkDataTarget } from "@entities/open-data-dk-push-data-target.entity";
import { MQTTInternalBrokerDevice } from "@entities/mqtt-internal-broker-device.entity";
import { MQTTExternalBrokerDevice } from "@entities/mqtt-external-broker-device.entity";
import { Gateway } from "@entities/gateway.entity";
import { Downlink } from "@entities/downlink.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Application,
      DataTarget,
      GenericHTTPDevice,
      HttpPushDataTarget,
      FiwareDataTarget,
      MqttDataTarget,
      OpenDataDkDataTarget,
      IoTDevice,
      IoTDevicePayloadDecoderDataTargetConnection,
      DeviceModel,
      LoRaWANDevice,
      OpenDataDkDataset,
      Organization,
      PayloadDecoder,
      Permission,
      ReceivedMessage,
      ReceivedMessageMetadata,
      SigFoxDevice,
      SigFoxGroup,
      User,
      Multicast,
      LorawanMulticastDefinition,
      ControlledProperty,
      ApplicationDeviceType,
      ApiKey,
      ReceivedMessageSigFoxSignals,
      PermissionTypeEntity,
      GatewayStatusHistory,
      MQTTInternalBrokerDevice,
      MQTTExternalBrokerDevice,
      Gateway,
      Downlink
    ]),
  ],
  providers: [AuditLog],
  exports: [TypeOrmModule, AuditLog],
})
export class SharedModule {}
