import { DataTargetType } from "@enum/data-target-type.enum";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";

export const dataTargetTypeMap = {
    [DataTargetType.HttpPush]: HttpPushDataTarget,
};
