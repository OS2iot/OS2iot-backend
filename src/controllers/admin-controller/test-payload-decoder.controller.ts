import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { TestPayloadDecoderDto } from "@dto/test-payload-decoder.dto";
import { BadRequestException, Body, Controller, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PayloadDecoderExecutorService } from "@services/data-management/payload-decoder-executor.service";

@ApiTags("Test PayloadDecoder")
@Controller("test-payload-decoder")
export class TestPayloadDecoderController {
  constructor(private payloadDecoderExecutorService: PayloadDecoderExecutorService) {}

  @Post()
  @ApiOperation({
    summary: `Test a payload decoder by uploading the code in javascript (as a string), and the IoTDevice (as a string) and the raw payload (as a string). \nUse JSON.stringify() on the objects to get a string representation`,
  })
  async decode(@Body() body: TestPayloadDecoderDto): Promise<any> {
    try {
      return await this.payloadDecoderExecutorService.allUntrustedCodeWithJsonStrings(
        body.code,
        body.iotDeviceJsonString,
        body.rawPayloadJsonString
      );
    } catch (err) {
      throw new BadRequestException(`Got error: ${err}`);
    }
  }
}
