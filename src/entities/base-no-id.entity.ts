import {
    CreateDateColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

/**
 * This is similar to the base entity class but without the id column. This allows classes to use
 * (composite) keys
 */
export abstract class DbBaseNoIdEntity {
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
