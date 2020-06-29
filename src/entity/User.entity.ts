import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "./Base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("user")
export class User extends DbBaseEntity {
    @Column()
    @ApiProperty()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    age?: number;

    toString(): string {
        return `User: id: ${this.id} - firstName: ${this.firstName} - lastName: ${this.lastName} - age: ${this.age}`;
    }
}
