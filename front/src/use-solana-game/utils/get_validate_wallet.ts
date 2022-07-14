import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Wallet } from "@solana/wallet-adapter-wallets";
import { WalletNotConnectedError } from "./wallet-error";


export interface ValidatedWalletCtx extends WalletContextState {
  publicKey: PublicKey;
  wallet: Wallet;
  adapter: ReturnType<Wallet['adapter']>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

export const validateWalletProps = (ctx: WalletContextState): ValidatedWalletCtx => {
  if (
    ctx.publicKey != null
    && ctx.wallet != null
    && ctx.adapter != null
    && ctx.signTransaction != null
    && ctx.signAllTransactions != null
    && ctx.signMessage != null
  ) {
    return ctx as ValidatedWalletCtx;
  }
  throw new WalletNotConnectedError();
};
