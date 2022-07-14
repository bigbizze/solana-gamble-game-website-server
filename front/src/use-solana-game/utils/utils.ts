import * as solana from "@solana/web3.js";
import { Connection, PublicKey, TokenAmount } from "@solana/web3.js";
import { Result } from "./shared_types";

export const sleep = async (duration: number) => new Promise(r => setTimeout(r, duration));

export const isTypeOne = <T1, T2>(val: T1 | T2, cond: boolean): val is T1 => cond;

export type SolanaAccountInfo = {
  pubkey: PublicKey,
  account: solana.AccountInfo<Buffer>
};


export const get_user_token_account = async (
  pubKey: PublicKey,
  mintPubKey: PublicKey,
  connection: Connection
): Promise<Result<ReturnType<typeof connection.getTokenAccountsByOwner>>> => {
  try {
    return await connection.getTokenAccountsByOwner(
      pubKey,
      { mint: mintPubKey }
    );
  } catch (e) {
    return new Error(`something went wrong with trying to get a token account for the user!\n${ e }`);
  }
};

/**
 * @param connection anchor connection
 * @param mintPubKey mint public key
 * @param pubKey the users public key
 * @param wagerAmount if this is undefined we do not check if accounts have enough
 */
export const getUserTokenAccs = async (
  connection: Connection,
  mintPubKey: PublicKey,
  pubKey: PublicKey,
  wagerAmount?: number
): Promise<Result<SolanaAccountInfo>> => {
  const user_token_accounts = await get_user_token_account(
    pubKey,
    mintPubKey,
    connection
  );
  if (user_token_accounts instanceof Error) {
    return user_token_accounts;
  } else if (
    !user_token_accounts.value
    || !Array.isArray(user_token_accounts.value)
    || user_token_accounts.value.length <= 0
  ) {
    return new Error("user does not have accounts for our token!");
  }

  const valid_user_token_accounts = wagerAmount !== 0 ? user_token_accounts.value.filter(async user_account => {
    try {
      const balance = await connection.getTokenAccountBalance(user_account.pubkey, "confirmed");
      const amount = (balance.value as TokenAmount).uiAmount;
      return amount != null && amount > wagerAmount;
    } catch (e) {
      console.error(e);
    }
  }) : user_token_accounts.value;
  if (valid_user_token_accounts.length <= 0) {
    return new Error("no accounts with enough tokens!");
  }
  return valid_user_token_accounts[0];
};
