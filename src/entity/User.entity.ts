import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    BeforeUpdate,
} from "typeorm";
import { validateOrReject, IsDefined } from "class-validator";

@Entity('user')
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
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    age?: number;

    toString(): string {
        return `User: id: ${this.id} - firstName: ${this.firstName} - lastName: ${this.lastName} - age: ${this.age}`;
    }
}
