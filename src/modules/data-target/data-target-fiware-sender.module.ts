import { HttpModule, Module } from "@nestjs/common";

import { FiwareDataTargetService } from "@services/data-targets/fiware-data-target.service";

@Module({
    imports: [HttpModule],
    providers: [FiwareDataTargetService],
    exports: [FiwareDataTargetService],
})

export class DataTargetFiwareSenderModule {}
