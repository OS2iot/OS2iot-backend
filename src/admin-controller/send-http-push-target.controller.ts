import {
    Controller,
} from "@nestjs/common";
import {
    ApiTags,
} from "@nestjs/swagger";
import { HttpPushTargetService } from "@services/http-push-target.service";

@ApiTags("HttpPushTarget")
@Controller("httpPushTarget")
export class HttpPushTargetController {
    constructor(private httpPushTargetService: HttpPushTargetService) {}
   
    
}
