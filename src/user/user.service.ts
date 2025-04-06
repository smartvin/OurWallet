import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly walletService: WalletService
  ) {}

  async createUser(email: string): Promise<User> {
    console.log('User Service - creating user with email:', email);
    const { address, encryptedPrivateKey } = await this.walletService.createWallet();
    const user = this.userRepository.create({
      email,
      walletAddress: address,
      encryptedPrivateKey,
    });
    const savedUser = await this.userRepository.save(user);
    console.log('User Service - user created:', savedUser.id);
    return savedUser;
  }

  async getUser(id: string): Promise<User | null> {
    console.log('User Service - getting user:', id);
    return this.userRepository.findOne({ where: { id: parseInt(id) } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('User Service - getting user by email:', email);
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserBalance(id: string): Promise<string> {
    console.log('User Service - getting balance for user:', id);
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.walletService.getBalance(user.walletAddress);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    console.log('User Service - finding user by Google ID:', googleId);
    return this.userRepository.findOne({ where: { googleId } });
  }

  async create(userData: Partial<User>): Promise<User> {
    console.log('User Service - creating user with data:', userData.email);
    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);
    console.log('User Service - user created:', savedUser.id);
    return savedUser;
  }

  async findById(id: number): Promise<User | null> {
    console.log('User Service - finding user by ID:', id);
    return this.userRepository.findOne({ where: { id } });
  }

  async updateWallet(id: number, walletAddress: string, encryptedPrivateKey: string): Promise<User> {
    console.log('User Service - updating wallet for user:', id);
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.walletAddress = walletAddress;
    user.encryptedPrivateKey = encryptedPrivateKey;
    user.walletCreatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    console.log('User Service - wallet updated:', walletAddress);
    return updatedUser;
  }
} 