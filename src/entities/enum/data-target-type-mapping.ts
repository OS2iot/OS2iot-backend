import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { FiwareDataTarget } from "@entities/fiware-data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";

export const dataTargetTypeMap = {
    [DataTargetType.HttpPush]: HttpPushDataTarget,
    [DataTargetType.Fiware]: FiwareDataTarget,

};
