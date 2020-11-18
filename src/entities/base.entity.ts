import {
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * This class contains all the values which are stored by default on all entities.
 *
 * Name is DbBaseEntity to not clash with BaseEntity from TypeORM (which is used in the active record).
 */
export abstract class DbBaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne("User", { nullable: true })
    @JoinColumn()
    createdBy?: number;

    @ManyToOne("User", { nullable: true })
    @JoinColumn()
    updatedBy?: number;
}
