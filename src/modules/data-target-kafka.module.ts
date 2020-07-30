import { Module, HttpModule } from "@nestjs/common";
import { DataTargetKafkaListenerService } from "@services/data-targets/data-target-kafka-listener.service";
import { KafkaModule } from "@modules/kafka.module";
import { IoTDeviceService } from "@services/iot-device.service";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationService } from "@services/application.service";
import { DataTargetService } from "@services/data-target.service";
import { DataTarget } from "@entities/data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { DataTargetSenderModule } from "@modules/data-target-sender.module";
import { HttpPushDataTargetService } from "@services/data-targets/http-push-data-target.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Application,
            IoTDevice,
            GenericHTTPDevice,
            DataTarget,
            HttpPushDataTarget,
        ]),
        HttpModule,
        KafkaModule,
        DataTargetSenderModule,
    ],
    providers: [
        IoTDeviceService,
        ApplicationService,
        DataTargetService,
        DataTargetKafkaListenerService,
        HttpPushDataTargetService,
    ],
})
export class DataTargetKafkaModule {}
