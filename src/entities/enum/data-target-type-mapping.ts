import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { MqttDataTarget } from "@entities/mqtt-data-target.entity";
import { OpenDataDkDataTarget } from "@entities/open-data-dk-push-data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";

export const dataTargetTypeMap = {
    [DataTargetType.HttpPush]: HttpPushDataTarget,
    [DataTargetType.Fiware]: FiwareDataTarget,
    [DataTargetType.MQTT]: MqttDataTarget,
    [DataTargetType.OpenDataDK]: OpenDataDkDataTarget,
};
