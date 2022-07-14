import { IdlType } from "@project-serum/anchor/dist/cjs/idl";
import { Program } from "./utils/program_type";
import { ValidatedWalletCtx } from "./utils/get_validate_wallet";
import { PublicKey } from "@solana/web3.js";
import { Option } from "./utils/shared_types";

type ProgramInfoType = {
  programId: string;
  mintKey: string
};

export interface ConfigJson extends ProgramInfoType {
  idl: IdlType;
}

export interface Config {
  idl: any,
  mintKey: string,
  programId: string
}

interface InitializedConfig {
  program: Program;
  mintKey: PublicKey;
  programId: PublicKey;
}

export type Loading<T> = T & {
  loading: boolean
}

export type Loadable<T> = T & {
  isLoaded: boolean
}

export interface SolanaGameKeys {
  matchPubKey: Option<string, null>;
  userMatchTokenPubKey: Option<string, null>;
  userTokenPubKey: Option<string, null>;
}

export interface ValidatedWalletContextState {
  wallet: ValidatedWalletCtx
}

export interface UseSolanaGameState {
  context: Loadable<ValidatedWalletContextState>;
  config: Loadable<ConfigJson> | null;
  userTokenBalance: Loading<TokenBal> | null;
  gameKeys: SolanaGameKeys;
  initializedConfig: Loadable<InitializedConfig> | null;
}

export type TokenBal = {
  userGameTokenBal: string
  userTokenBal: string
};

type UpdateValidatedContext = {
  type: 'UpdateValidatedContext',
  value: ValidatedWalletCtx
};

type UpdateInitializedConfig = {
  type: "UpdateInitializedConfig",
  value: Partial<Loadable<InitializedConfig>>
}

type UpdateConfig = {
  type: "UpdateConfig",
  value: ConfigJson
};

type UpdateUserTokenBalance = {
  type: "UpdateUserTokenBalance",
  value: Partial<TokenBal>
};

type SetUserBalanceIsLoading = {
  type: "SetUserBalanceIsLoading",
  value: boolean
};

type SetKeys = {
  type: "SetKeys",
  value: Partial<SolanaGameKeys>
};


export type SolanaGameAction =
  UpdateValidatedContext
  | UpdateConfig
  | UpdateUserTokenBalance
  | SetUserBalanceIsLoading
  | SetKeys
  | UpdateInitializedConfig;

const resolvePartial = <T>(oldState: T, partialNewState: Partial<T>): T => {
  const newState: T = { ...oldState };
  for (const key of Object.keys(oldState)) {
    if (partialNewState.hasOwnProperty(key)) {
      newState[key] = partialNewState[key];
    }
  }
  return newState;
};

export const initialState: UseSolanaGameState = {
  config: null,
  context: null,
  userTokenBalance: null,
  gameKeys: {
    matchPubKey: null,
    userTokenPubKey: null,
    userMatchTokenPubKey: null
  },
  initializedConfig: null
};

const checkLoaders = (state: UseSolanaGameState): UseSolanaGameState => ({
  ...state,
  config: {
    ...state.config,
    isLoaded: state.config !== null
  },
  context: {
    ...state.context,
    isLoaded: state.context !== null
  }
});

export const gameStateReducer = (_state: UseSolanaGameState, action: SolanaGameAction): UseSolanaGameState => {
  const state = checkLoaders(_state);
  switch (action.type) {
    case "UpdateInitializedConfig":
      return {
        ...state,
        initializedConfig: {
          ...resolvePartial(state.initializedConfig, action.value),
          isLoaded: true
        }
      };
    case "SetKeys":
      return {
        ...state,
        gameKeys: resolvePartial(state.gameKeys, action.value)
      };
    case "SetUserBalanceIsLoading":
      return {
        ...state,
        userTokenBalance: {
          ...state.userTokenBalance,
          loading: action.value
        }
      };
    case "UpdateUserTokenBalance":
      return {
        ...state,
        userTokenBalance: {
          ...resolvePartial(state.userTokenBalance, action.value),
          loading: false
        }
      };
    case 'UpdateValidatedContext':
      return {
        ...state,
        context: {
          wallet: action.value,
          isLoaded: state.context.isLoaded
        }
      };
    case "UpdateConfig":
      return {
        ...state,
        config: {
          ...action.value,
          isLoaded: state.config.isLoaded
        }
      };
    default:
      return state;
  }
};
