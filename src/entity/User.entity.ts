import { Entity, Column } from "typeorm";
import { DbBaseEntity } from "./base.entity";

@Entity("user")
/**
 * @swagger
 * definitions:
 *   User:
 *     required:
 *       - firstName
 *       - lastName
 *     properties:
 *       firstName:
 *         type: string
 *       lastName:
 *         type: string
 */
export class User extends DbBaseEntity {
    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    age?: number;

    toString(): string {
        return `User: id: ${this.id} - firstName: ${this.firstName} - lastName: ${this.lastName} - age: ${this.age}`;
    }
}
