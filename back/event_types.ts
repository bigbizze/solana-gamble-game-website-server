export interface PlayFromClient<S> {
  matchPubKey: string;
  userPubKey: string;
  updatedGameState: S;
}

export interface PlayToClients {
  address: string;
  move: string;
}


export interface QueueItem {
  userPubKey: string,
  socketId: string,
  timeOf: number
}

export interface MatchedEvent {
  // url: string,
  matchPubKey: string
}
