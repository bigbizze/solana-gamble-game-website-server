import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useReducer } from "react";
import * as anchor from "@project-serum/anchor";
import { BN, Provider } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AddUserArgs, Program } from "./utils/program_type";
import { getUserTokenAccs } from "./utils/utils";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { validateWalletProps } from "./utils/get_validate_wallet";
import { Option } from "./utils/shared_types";
import { TokenBal } from "../containers/Homepage";
import {
  ConfigJson,
  gameStateReducer,
  initialState,
  Loading,
  SolanaGameAction,
  SolanaGameKeys,
  UseSolanaGameState
} from "./state-reducer";


export interface Config {
  idl: any,
  mintKey: string,
  programId: string
}

export async function getUpdatedUserBal(connection: Connection, pubKey: Partial<SolanaGameKeys>): Promise<TokenBal>;
export async function getUpdatedUserBal(connection: Connection, pubKey: PublicKey[]): Promise<string[]>;
export async function getUpdatedUserBal(connection: Connection, pubKey: PublicKey): Promise<string>;
export async function getUpdatedUserBal(connection: Connection, pubKey: PublicKey | PublicKey[] | Omit<Partial<SolanaGameKeys>, "matchPubKey">): Promise<string | string[] | TokenBal> {
  if (Array.isArray(pubKey)) {
    return pubKey.reduce(async (obj, pk: PublicKey): Promise<string[]> => ([
      ...await obj,
      await getUpdatedUserBal(connection, pk)
    ]), Promise.resolve([] as string[]));
  } else if (!(pubKey instanceof PublicKey)) {
    const newBal = await Object.entries(pubKey).reduce(async (obj, [ key, pk ]): Promise<TokenBal> => ({
      ...await obj,
      [key]: await getUpdatedUserBal(connection, new PublicKey(pk))
    }), Promise.resolve({ userTokenBal: "", userGameTokenBal: "" } as TokenBal));
    return {
      userTokenBal: newBal.userTokenBal != null ? newBal.userTokenBal : undefined,
      userGameTokenBal: newBal.userGameTokenBal != null ? newBal.userGameTokenBal : undefined
    };
  }
  return (await connection.getTokenAccountBalance(pubKey)).value.amount;
}

async function getConfig(attempts = 0): Promise<ConfigJson> {
  try {
    /** TODO: change user hosting this repo
     */
    const res = await fetch("https://raw.githubusercontent.com/bigbizze/solana-gamble-game-config/master/solana-gamble-game-config.json");
    if (res.ok) {
      return JSON.parse(await res.text());
    }
  } catch (e) {
    if (attempts > 15) {
      throw e;
    }
    await new Promise(r => setTimeout(r, 1000 * (attempts + 1)));
    return await getConfig(attempts + 1);
  }
}

interface UseSolanaGameMethods {
  userTokenBalance: Loading<TokenBal> | null;

  addUserToMatch(matchPubKey: string): Promise<void>;

  updateUserBalance(): Promise<Option<TokenBal, void>>;
}

const getUserTokenAccFn = async (
  connection: Connection,
  state: UseSolanaGameState,
  dispatch: (action: SolanaGameAction) => void
) => {
  if (state.gameKeys.userTokenPubKey === null && state.context.isLoaded) {
    dispatch({ type: "SetUserBalanceIsLoading", value: true });
    const userTokenAccount = await getUserTokenAccs(connection, state.initializedConfig.mintKey, state.context.wallet.publicKey);
    dispatch({ type: "SetUserBalanceIsLoading", value: false });
    if (!(userTokenAccount instanceof Error)) {
      const userTokenPubKey = userTokenAccount.pubkey.toString();
      dispatch({ type: "SetKeys", value: { userTokenPubKey } });
      return userTokenAccount.pubkey;
    } else {
      throw userTokenAccount;
    }
  }
};

const updateBalanceFn = async (
  connection: Connection,
  state: UseSolanaGameState,
  dispatch: (action: SolanaGameAction) => void
) => {
  if (!state.gameKeys.userTokenPubKey) {
    return;
  }
  dispatch({ type: "SetUserBalanceIsLoading", value: true });
  const keys: Omit<Partial<SolanaGameKeys>, "matchPubKey"> = {
    userTokenPubKey: state.gameKeys.userTokenPubKey,
    userMatchTokenPubKey: state.gameKeys.userMatchTokenPubKey !== null ? state.gameKeys.userMatchTokenPubKey : undefined
  };
  try {
    const userGameTokenBal = await getUpdatedUserBal(connection, keys);
    dispatch({ type: "UpdateUserTokenBalance", value: userGameTokenBal });
    return userGameTokenBal;
  } catch (e) {
    return console.error(e);
  }
};

export function useSolanaGame(wagerAmount: number): UseSolanaGameMethods {
  const walletContextState = useWallet();
  const { connection } = useConnection();
  const [ state, dispatch ] = useReducer(gameStateReducer, initialState);

  useEffect(() => {
    getConfig()
      .then(res => dispatch({ type: "UpdateConfig", value: res }))
      .catch(e => console.error(e));
  }, []);
  useEffect(() => {
    if (walletContextState.publicKey) {
      if (state.initializedConfig && state.initializedConfig.isLoaded) {
        dispatch({ type: "UpdateInitializedConfig", value: { isLoaded: false }});
      }
      const validatedWalletCtx = validateWalletProps(walletContextState);
      dispatch({ type: "UpdateValidatedContext", value: validatedWalletCtx });
    }
  }, [ connection, walletContextState ]);

  useEffect(() => {
    if (state.config.isLoaded && !state.context.isLoaded && state.context.wallet != null) {
      const provider = new Provider(
        connection,
        state.context.wallet,
        { commitment: "processed" }
      );
      const mintKey = new PublicKey(state.config.mintKey);
      const programId = new PublicKey(state.config.programId);
      const program = new anchor.Program(
        // @ts-ignore
        state.config.idl,
        programId,
        provider
      ) as unknown as Program;
      dispatch({ type: "UpdateInitializedConfig", value: { program, mintKey, programId } });
    }
  }, [ connection, state.config, state.context.isLoaded, walletContextState.publicKey ]);

  // const getUserTokenAccount = useCallback(async () => {
  //     await getUserTokenAccFn(connection, state, dispatch);
  // }, [ connection, state.context, state.gameKeys ]);

  const updateUserBalance = useCallback(async () => {
    await updateBalanceFn(connection, state, dispatch);
  }, [ connection, state.gameKeys ]);

  useEffect(() => {
    if (state.context.isLoaded && !state.userTokenBalance.loading) {
      if (state.gameKeys.userTokenPubKey === null) {
        getUserTokenAccFn(connection, state, dispatch)
          .catch(e => console.error(e));
      } else {
        updateBalanceFn(connection, state, dispatch)
          .catch(e => console.error(e));
      }
    }
  }, [ connection, state.context, state.gameKeys, state.userTokenBalance.loading ]);

  const addUserToMatch = useCallback(async (matchPubKey: string, updateBalanceAfter = true) => {
    if (!state.context.isLoaded) {
      return console.log("validated args is undefined!");
    } else if (!state.gameKeys.userTokenPubKey) {
      return console.log("userTokenPubKey is undefined!");
    }
    // console.log("OK");
    const { wallet: { publicKey } } = state.context;
    const { program, mintKey } = state.initializedConfig;

    const userMatchTokenPubKey = anchor.web3.Keypair.generate();

    dispatch({
      type: "SetKeys",
      value: { matchPubKey, userMatchTokenPubKey: userMatchTokenPubKey.publicKey.toString() }
    });

    const addUserAccounts: AddUserArgs = {
      accounts: {
        mint: mintKey,
        userAccount: publicKey,
        fromUserTokenAccount: new PublicKey(state.gameKeys.userTokenPubKey),
        toTempUserTokenAccount: userMatchTokenPubKey.publicKey,
        matchAuthority: new PublicKey(matchPubKey),
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [ userMatchTokenPubKey ]
    };

    console.log(addUserAccounts);

    const signature = await program.rpc.addUser(new BN(wagerAmount), addUserAccounts);

    const sigResult = await connection.confirmTransaction(signature, 'processed');
    // await new Promise(r => setTimeout(r, 500));
    console.log(sigResult.value.err === null ? "txn succeess!" : `txn failed ${ sigResult.value.err }`);
    if (updateBalanceAfter) {
      await updateBalanceFn(connection, state, dispatch);
    }
  }, [ connection, state.context, state.gameKeys ]);

  return {
    addUserToMatch,
    userTokenBalance: state.userTokenBalance,
    updateUserBalance,
  };
}






