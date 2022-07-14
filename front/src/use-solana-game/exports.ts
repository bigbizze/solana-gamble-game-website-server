import * as anchor from "@project-serum/anchor";
import * as solana from "@solana/web3.js";

export const solanaKeypair = anchor.web3.Keypair;
export type InternalSolanaKeypair = typeof anchor.web3.Keypair.prototype;
export const genKeypair = anchor.web3.Keypair.generate;

export const solanaPubKey = anchor.web3.PublicKey.prototype;
export type SolanaPubKey = typeof solanaPubKey;

export {
  anchor,
  solana
};
