import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";

export const dataTargetTypeMap = {
    [DataTargetType.HttpPush]: HttpPushDataTarget,
};
