import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

    toString():string {
        return `User: id: ${this.id} - firstName: ${this.firstName} - lastName: ${this.lastName} - age: ${this.age}`;
    }
}
