import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { ChainCode } from '../ContractConnector/chainCode';

@Injectable()
export class WalletService {
  private readonly encryptionKey: Buffer;
  private readonly encryptionIv: Buffer;
  public providers: Record<string, ethers.Provider>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {
    this.encryptionKey = Buffer.from(configService.get<string>('WALLET_ENCRYPTION_KEY'), 'hex');
    this.encryptionIv = Buffer.from(configService.get<string>('WALLET_ENCRYPTION_IV'), 'hex');
    const amoyProvider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
    console.log("amoy provider is %s", amoyProvider);
    this.providers = {
      amoy: new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL),
      polygon: new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL),
    };
  }

  async createWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      encryptedPrivateKey: this.encryptPrivateKey(wallet.privateKey),
    };
  }

  async getWalletInfo(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user?.walletAddress) throw new Error('Wallet not found');

    const networks = await Promise.all(
      Object.entries(this.providers).map(async ([chain, provider]) => ({
        chain,
        connected: true,
        network: (await provider.getNetwork()).name,
      }))
    );

    return { address: user.walletAddress, networks };
  }

  async connectToChain(userId: number, chain: 'amoy' | 'polygon') {
    const user = await this.userService.findById(userId);
    if (!user?.walletAddress) throw new Error('Wallet not found');
    const signer = await this.getSigner(userId);
    if (!this.providers[chain]) throw new Error('Unsupported chain');
    console.log("WalletService.connectToChain: using URL %s for chain %s", 
      process.env.AMOY_RPC_URL, chain);
    console.log("connect user %s with signer %s to chain %s", 
      userId, signer.address, chain);
    console.log("our network is %s for chain %s", await this.providers[chain].getNetwork(), chain);
  
    const network = await this.providers[chain].getNetwork();
    console.log("network is %s", network.chainId);
    let chainID = Number(network.chainId)
    ChainCode.initContracts(chain, chainID, signer);
    return {
      chain,
      connected: true,
      network: network.chainId
    };

  }

  async getSigner(userId: number) {
    const user = await this.userService.findById(userId);
    return(new ethers.Wallet(
      this.decryptPrivateKey(user.encryptedPrivateKey),
      this.providers.amoy
    ));
  }

  async callContract(userId: number, contractAddress: string, functionSelector: string, params: any[]) {
    const user = await this.userService.findById(userId);
    if (!user?.walletAddress) throw new Error('Wallet not found');

    const wallet = new ethers.Wallet(
      this.decryptPrivateKey(user.encryptedPrivateKey),
      this.providers.amoy
    );

    const contract = new ethers.Contract(
      contractAddress,
      ['function ' + functionSelector],
      wallet
    );

    return contract[functionSelector](...params);
  }

  async signTransaction(encryptedPrivateKey: string, transaction: ethers.TransactionRequest) {
    return new ethers.Wallet(this.decryptPrivateKey(encryptedPrivateKey))
      .signTransaction(transaction);
  }

  async getBalance(address: string) {
    return ethers.formatEther(await this.providers.amoy.getBalance(address));
  }

  private encryptPrivateKey(privateKey: string): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIv);
    return cipher.update(privateKey, 'utf8', 'hex') + cipher.final('hex');
  }

  private decryptPrivateKey(encryptedKey: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIv);
    return decipher.update(encryptedKey, 'hex', 'utf8') + decipher.final('utf8');
  }
} 