import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class UpdatePermissionDto {
  @ApiProperty({ required: true })
  @IsString()
  @Length(1, 1024)
  name: string;

  @ApiProperty({
    required: true,
    type: "array",
    items: {
      type: "number",
    },
  })
  userIds: number[];

  @ApiProperty({
    required: true,
    type: "array",
    items: {
      type: "number",
    },
  })
  applicationIds?: number[];

  @ApiProperty({ required: false })
  automaticallyAddNewApplications?: boolean;
}
