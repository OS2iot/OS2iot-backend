import { Module, HttpModule } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { RecieveDataController } from "@admin-controller/recieve-data.controller";
import { RecieveDataService } from "@services/recieve-data.service";

@Module({
    imports: [TypeOrmModule.forFeature([RecieveData]),HttpModule],
    exports: [TypeOrmModule],
    controllers: [RecieveDataController],
    providers: [RecieveDataService],
})
export class RecieveDataModule { }
