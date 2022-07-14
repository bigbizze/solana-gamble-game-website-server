// import { solanaGame, solanaGameWithQueue, solanaMatch } from "./index";
// import { solanaChainIo } from "../setup-solana-chain-io";
// import { io, redisClient } from "../index";
// import { checkConnectFourWinner } from "../games/connect-four";
//
// export type MatchType =
//   "Connect4"
//   | "YankeesLose"
//   | "JoinLobbyConnect4";
//
// export const matchTypes: MatchType[] = [ "Connect4", "YankeesLose", "JoinLobbyConnect4" ];
//
//
// solanaMatch<MatchType>(solanaChainIo, io, {
//   gameName: "YankeesLose",
//   matchTypes, /** This should probably be in a initialization method which returns these methods */
//   numUsersInMatch: { min: 2, max: 2 }
// }, null, {
//   async endMatch(matchPubKey, { matchUsers }, socket, globalNamespace) {
//
//   }
// });
//
// type Connect4Type = string[][];
//
// solanaGame<MatchType, Connect4Type>(solanaChainIo, io, {
//   gameName: "JoinLobbyConnect4",
//   matchTypes,
//   numUsersInMatch: { min: 2, max: 2 }
// }, {
//   async gameFlow(matchPubKey, { newGameState, userPubKey }, socket, globalNamespace): Promise<void> {
//     const maybeIsWinner = checkConnectFourWinner(newGameState);
//     if (maybeIsWinner) {
//       await solanaChainIo.transferAllToWinner(matchPubKey, maybeIsWinner);
//     }
//   }
// });
//
// solanaGameWithQueue<MatchType, Connect4Type>(solanaChainIo, io, redisClient, {
//   gameName: "Connect4",
//   matchTypes,
//   expiryInterval: { minutes: 5 },
//   numUsersInMatch: { min: 2, max: 2 }
// }, {
//   async gameFlow(matchPubKey, { newGameState, userPubKey }, socket, globalNamespace): Promise<void> {
//     const maybeIsWinner = checkConnectFourWinner(newGameState);
//     if (maybeIsWinner) {
//       await solanaChainIo.transferAllToWinner(matchPubKey, maybeIsWinner);
//     }
//   }
// });
