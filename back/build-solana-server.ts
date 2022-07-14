import createSolanaGameServer, { asyncRedis, Match, UserRecord, MatchRecord, MatchArgs, UpdateMatchArgs, Result } from "./solana-game-contract-io/src";
import { solanaGame, solanaGameWithQueue, solanaMatch } from "./solana-game-maker";
import { checkConnectFourWinner } from "./games/connect-four";
// @ts-ignore
import { AsyncRedisClient } from "async-redis";

export type MatchType =
  "Connect4"
  | "YankeesLose"
  | "JoinLobbyConnect4";

export const matchTypes: MatchType[] = [ "Connect4", "YankeesLose", "JoinLobbyConnect4" ];

export const buildSolanaServer = (redisClient: AsyncRedisClient, io: any) => {
  const solanaChainIo = createSolanaGameServer({
    pathToWalletKeyPair: `${ require("app-root-path").path }/kp.json`,
    rpcConnection: "devnet",
    matchTypes
  }, {
    writeMatchRecord: async ({ matchPubKeyPair: { publicKey, secretKey } }) => {
      const match: Match = {
        matchPubKey: publicKey,
        secretKey: secretKey,
        users: []
      };
      await redisClient.set(publicKey, JSON.stringify(match));
    },
    writeUserRecord: async (userRecord: UserRecord): Promise<void> => {
      const matchRecord = await redisClient.get(userRecord.matchPubKey);
      const match: Match = JSON.parse(matchRecord);
      if (!match.users.some(x => x.userPubKey === userRecord.userPubKey)) {
        const newMatch: Match = {
          ...match,
          users: [
            ...match.users,
            userRecord
          ]
        };
        await redisClient.set(userRecord.matchPubKey, JSON.stringify(newMatch));
      }
    },
    getMatchRecordByPubKey: async ({ matchPubKey }: MatchArgs): Promise<Result<MatchRecord>> => {
      const matchRecord = await redisClient.get(matchPubKey);
      if (matchRecord == null) {
        return new Error("couldn't get match record!");
      }
      const match = JSON.parse(matchRecord) as Match;
      return {
        matchPubKey: match.matchPubKey,
        secretKey: match.secretKey
      };
    },
    getMatchRecordsByMatchType: async ({ matchType }: { matchType: MatchType }) => {
      return null as any; // TODO
    },
    getUserRecords: async ({ matchPubKey }: MatchArgs): Promise<UserRecord[]> => {
      const matchRecord = await redisClient.get(matchPubKey);
      const match = JSON.parse(matchRecord) as Match;
      return match.users;
    },
    removeUserRecords: async ({ matchPubKey, newMatchState }: UpdateMatchArgs): Promise<void> => {
      await redisClient.set(matchPubKey, JSON.stringify(newMatchState));
    },
    removeMatch: async ({ matchPubKey }: MatchArgs): Promise<void> => {
      await redisClient.del(matchPubKey);
    }
  }, process.env.GAME_PASS_KEY);

  solanaMatch<MatchType>(solanaChainIo, io, {
    gameName: "YankeesLose",
    matchTypes, /** This should probably be in a initialization method which returns these methods */
    numUsersInMatch: { min: 2, max: 2 }
  }, null, {
    async endMatch(matchPubKey, { matchUsers }, socket, globalNamespace) {

    }
  });

  type Connect4Type = string[][];

  solanaGame<MatchType, Connect4Type>(solanaChainIo, io, {
    gameName: "JoinLobbyConnect4",
    matchTypes,
    numUsersInMatch: { min: 2, max: 2 }
  }, {
    async gameFlow(matchPubKey, { newGameState, userPubKey }, socket, globalNamespace): Promise<void> {
      const maybeIsWinner = checkConnectFourWinner(newGameState);
      if (maybeIsWinner) {
        await solanaChainIo.transferAllToWinner(matchPubKey, maybeIsWinner);
      }
    }
  });

  solanaGameWithQueue<MatchType, Connect4Type>(solanaChainIo, io, redisClient, {
    gameName: "Connect4",
    matchTypes,
    expiryInterval: { minutes: 5 },
    numUsersInMatch: { min: 2, max: 2 }
  }, {
    async gameFlow(matchPubKey, { newGameState, userPubKey }, socket, globalNamespace): Promise<void> {
      const maybeIsWinner = checkConnectFourWinner(newGameState);
      if (maybeIsWinner) {
        await solanaChainIo.transferAllToWinner(matchPubKey, maybeIsWinner);
      }
    }
  });
};
