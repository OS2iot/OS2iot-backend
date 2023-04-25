import { DataTarget } from "@entities/data-target.entity";
import { DataTargetType } from "@enum/data-target-type.enum";
import { BeforeInsert, ChildEntity } from "typeorm";

@ChildEntity(DataTargetType.OpenDataDK)
export class OpenDataDkDataTarget extends DataTarget {
    @BeforeInsert()
    private beforeInsert() {
        this.type = DataTargetType.OpenDataDK;
    }
}
