import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateApiKeyDto {
    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 50)
    name: string;

    @ApiProperty({
        required: true,
        type: "array",
        items: {
            type: "number",
        },
    })
    permissionIds: number[];
}
