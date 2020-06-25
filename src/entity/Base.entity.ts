import {
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryGeneratedColumn,
} from "typeorm";

/**
 * This class contains all the values which are stored by default on all entities.
 *
 * Name is DbBaseEntity to not clash with BaseEntity from TypeORM (which is used in the active record).
 */
export abstract class DbBaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;

    // TODO: Introduce createdBy and updatedBy after user access control system
}
