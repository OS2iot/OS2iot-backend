import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ApiKey } from "@entities/api-key.entity";
import { ApplicationDeviceType } from "@entities/application-device-type.entity";
import { Application } from "@entities/application.entity";
import { ControlledProperty } from "@entities/controlled-property.entity";
import { DataTarget } from "@entities/data-target.entity";
import { DatatargetLog } from "@entities/datatarget-log.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";
import { Gateway } from "@entities/gateway.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { LorawanMulticastDefinition } from "@entities/lorawan-multicast.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { MQTTExternalBrokerDevice } from "@entities/mqtt-external-broker-device.entity";
import { MQTTInternalBrokerDevice } from "@entities/mqtt-internal-broker-device.entity";
import { Multicast } from "@entities/multicast.entity";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { OpenDataDkDataTarget } from "@entities/open-data-dk-push-data-target.entity";
import { Organization } from "@entities/organization.entity";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PermissionTypeEntity } from "@entities/permissions/permission-type.entity";
import { Permission } from "@entities/permissions/permission.entity";
import { ReceivedMessageMetadata } from "@entities/received-message-metadata.entity";
import { ReceivedMessageSigFoxSignals } from "@entities/received-message-sigfox-signals.entity";
import { ReceivedMessage } from "@entities/received-message.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { User } from "@entities/user.entity";
import { AuditLog } from "@services/audit-log.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Application,
      DataTarget,
      DatatargetLog,
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
    ]),
  ],
  providers: [AuditLog],
  exports: [TypeOrmModule, AuditLog],
})
export class SharedModule {}
