import { ReceivedMessageSigFoxSignals } from "@entities/received-message-sigfox-signals.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, IsNull, Not, Repository } from "typeorm";

@Injectable()
export class SigFoxMessagesService {
    constructor(
        @InjectRepository(ReceivedMessageSigFoxSignals)
        private receivedMessageSigFoxSignalsRepository: Repository<ReceivedMessageSigFoxSignals>
    ) {}

    getMessageSignals(deviceId: number, fromDate: Date, toDate: Date): Promise<ReceivedMessageSigFoxSignals[]> {
        return this.receivedMessageSigFoxSignalsRepository.find({
            where: {
                device: { id: deviceId },
                sentTime: Between(fromDate, toDate),
                rssi: Not(IsNull()),
            },
        });
    }
}
