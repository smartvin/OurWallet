import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  googleId: string;

  @Column()
  email: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ nullable: true })
  encryptedPrivateKey: string;

  @Column({ nullable: true })
  walletCreatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 