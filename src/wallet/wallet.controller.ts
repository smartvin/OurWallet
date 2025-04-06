import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SessionGuard } from '../session/guards/session.guard';
import { UserId } from '../session/decorators/session.decorator';
import { ethers } from 'ethers';

@Controller('wallet')
@UseGuards(SessionGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('create')
  async createWallet() {
    return this.walletService.createWallet();
  }

  @Post('sign')
  async signTransaction(
    @Body() body: { encryptedPrivateKey: string; transaction: ethers.TransactionRequest }
  ) {
    return this.walletService.signTransaction(body.encryptedPrivateKey, body.transaction);
  }

  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    return this.walletService.getBalance(address);
  }

  @Get(':userId/info')
  async getWalletInfo(@UserId() userId: number) {
    return this.walletService.getWalletInfo(userId);
  }

  @Post(':userId/connect/:chain')
  async connectToChain(
    @UserId() userId: number,
    @Param('chain') chain: 'amoy' | 'polygon'
  ) {
    return this.walletService.connectToChain(userId, chain);
  }

  @Post(':userId/contract')
  async callContract(
    @UserId() userId: number,
    @Body() body: { contractAddress: string; functionSelector: string; params: any[] }
  ) {
    return this.walletService.callContract(
      userId,
      body.contractAddress,
      body.functionSelector,
      body.params
    );
  }
} 