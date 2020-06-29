import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    getDefault(): string {
        return "OS2IoT backend - See /api/v1/docs for Swagger";
    }
}
