export interface PlayFromClient {
  roomId: string;
  address: string;
  updateGrid: any;
}

export interface PlayToClients {
  address: string;
  move: string;
}


export interface QueueItem {
  userAddress: string,
  socketId: string
}

export interface MatchedEvent {
  url: string,
  matchPubKey: string
}

export interface MatchFinished {
  winnings: number;
  winningUserPubKey: string;
}

// export interface LeaveEvent {
//     txn: Option<string>;
// }

export interface JoinQueue {
  userPubKey: string;
}

export interface LeaveGame {
  userPubKey: string;
  matchPubKey: string;
}

export interface RpcUserAddedToMatch {
  matchPubKey: string;
  userPubKey: string;
  userTokenPubKey: string;
  userMatchTokenPubKey: string;
}

export type UserItem = {
  pubKey: string
  tokenKey?: string
}

export interface MatchItem {
  matchPubKey: string,
  secretKey: string,
  users: UserItem[]
}
