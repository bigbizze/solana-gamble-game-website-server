import socketIO, { Namespace, Socket as SocketIO } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { getOneOfTimeDiff, RequireOnlyOne, TimeArgs } from "./utils/general";
import { io } from "../index";
import { SolanaGameChainIo } from "../solana-game-contract-io/src";
import { MatchedEvent, QueueItem } from "../event_types";
import { getFromQueue } from "./utils/queue";
// @ts-ignore
import { AsyncRedisClient } from "async-redis";
// import { AsyncRedisClient } from "async-redis";
//

type Socket = SocketIO<DefaultEventsMap, DefaultEventsMap>;

type MatchUpdate<U> = (
  matchPubKey: string,
  eventUpdate: U,
  socket: Socket,
  globalNamespace: Namespace
) => Promise<void>;

// type NullableMatchUpdate<U> = (
//   matchPubKey: string | null,
//   eventUpdate: U,
//   socket: Socket,
//   globalNamespace: Namespace
// ) => Promise<void>;

type UnknownMatchUpdate<U> = (
  eventUpdate: U,
  socket: Socket,
  globalNamespace: Namespace
) => Promise<void>;

type NoParamMatchUpdate = (
  socket: Socket,
  globalNamespace: Namespace
) => Promise<void>;

interface SolanaMatchEventsBase<M> {
  leaveMatch?: MatchUpdate<{ userPubKey: string }>;
  getMatchTypes?: NoParamMatchUpdate;
}

interface SolanaMatchConfigBase<M> {
  gameName: M,
  matchTypes: M[],
  joinSuccess?: MatchUpdate<{
    userPubKey: string,
    userTokenPubKey: string,
    userMatchTokenPubKey: string
  }>
  numUsersInMatch: {
    min: number,
    max: number
  };
}

interface SolanaMatchEventMethods<M> extends SolanaMatchEventsBase<M> {
  matchesAvailable?: UnknownMatchUpdate<{ matchType: M }>;
}

interface SolanaServerMethods {
  endMatch: MatchUpdate<{ matchUsers: string[] }>;
}

interface SolanaGameConfig<M> extends SolanaMatchConfigBase<M> {
  expiryInterval: RequireOnlyOne<TimeArgs>;
}

interface SolanaGameEvents<M, S> extends SolanaMatchEventsBase<M> {
  gameFlow: MatchUpdate<{ userPubKey: string, newGameState: S }>;
}

interface SolanaGameWithQueueEvents<M, S> extends SolanaGameEvents<M, S> {
  joinQueue?: UnknownMatchUpdate<{ userPubKey: string, gameType: M }>;
}

type SolanaMatchEventType<M, S> =
  SolanaMatchEventMethods<M>
  | SolanaGameEvents<M, S>
  | SolanaGameWithQueueEvents<M, S>;

const createSolanaMatch = <M, S>(
  config: SolanaMatchConfigBase<M>,
  eventMethods: SolanaMatchEventType<M, S>,
  serverMethods?: SolanaServerMethods
) => {
  const globalNamespace: Namespace = io.of(config.gameName as unknown as string);
  globalNamespace.on("connection", (socket: Socket) => {
    for (const key of Object.keys(eventMethods) as (keyof SolanaMatchEventType<M, S>)[]) {
      const methodFn = eventMethods[key];
      if (typeof methodFn === "function") {
        socket.on(key, methodFn);
      }
    }
  });
};

const solanaMatchBase = <M>(
  solanaChainIo: SolanaGameChainIo<M>,
  config: SolanaMatchConfigBase<M>,
  eventMethods: SolanaMatchEventsBase<M>
) => {
  const globalNamespace: Namespace = io.of(config.gameName as unknown as string);
  return {
    async getMatchTypes(socket) {
      globalNamespace.to(socket.id).emit("matchTypes", config.matchTypes);
    },
    async joinSuccess(matchPubKey, eventUpdate, socket): Promise<void> {
      try {
        if (SolanaGameChainIo.isValidPubKey(matchPubKey)) {
          await solanaChainIo.addSignedUserToMatch(matchPubKey, eventUpdate);
          socket.join(matchPubKey);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async leaveMatch(matchPubKey, { userPubKey }, socket): Promise<void> {
      try {
        if (SolanaGameChainIo.isValidPubKey(matchPubKey)) {
          await solanaChainIo.leaveGame(matchPubKey, userPubKey);
          socket.leave(matchPubKey);
        }
      } catch (e) {
        console.error(e);
      }
    },
    ...eventMethods
  };
};

export const solanaMatch = <M>(
  solanaChainIo: SolanaGameChainIo<M>,
  socketIoServer: socketIO.Server,
  config: SolanaMatchConfigBase<M>,
  eventMethods: SolanaMatchEventMethods<M> | null,
  serverMethods: SolanaServerMethods,
  returnConfig = false
): SolanaMatchEventMethods<M> | void => {
  const globalNamespace: Namespace = io.of(config.gameName as unknown as string);
  const resolvedEventMethods: SolanaMatchEventMethods<M> = {
    ...solanaMatchBase(solanaChainIo, config, eventMethods),
    async matchesAvailable({ matchType }, socket) {
      try {
        const availableMatches = await solanaChainIo.getAvailableMatches(matchType);
        globalNamespace.to(socket.id).emit("matchesAvailable", availableMatches);
      } catch (e) {
        console.error(e);
      }
    },
    ...eventMethods
  };
  const resolvedServerMethods: SolanaServerMethods = {
    ...serverMethods,
    /** TODO: figure out what to do with "endMatch", as this obviously can't be an event which the client triggers
     *        consider "checkForEndOfMatch" where we use setInterval or something? not sure tbh
     */
    async endMatch(matchPubKey, serverMethodArgs, socket, globalNamespace) {
      try {
        await serverMethods.endMatch(matchPubKey, serverMethodArgs, socket, globalNamespace);
      } catch (e) {
        console.error(e);
      }
    }
  };
  if (returnConfig) {
    return resolvedEventMethods;
  }
  createSolanaMatch(config, resolvedEventMethods, resolvedServerMethods);
};

export const solanaGame = <M, S>(
  solanaChainIo: SolanaGameChainIo<M>,
  socketIoServer: socketIO.Server,
  config: SolanaMatchConfigBase<M>,
  eventMethods: SolanaGameEvents<M, S>,
  returnConfig = false
): SolanaGameEvents<M, S> | void => {
  const resolvedEventMethods: SolanaGameEvents<M, S> = {
    ...solanaMatchBase(solanaChainIo, config, eventMethods),
    ...eventMethods,
    async gameFlow(matchPubKey, eventUpdate, socket, globalNamespace) {
      try {
        globalNamespace.to(matchPubKey).emit("updateMatch", eventUpdate.newGameState);
        return await eventMethods.gameFlow(matchPubKey, eventUpdate, socket, globalNamespace);
      } catch (e) {
        console.error(e);
      }
    }
  };
  if (returnConfig) {
    return resolvedEventMethods;
  }
  createSolanaMatch(config, resolvedEventMethods);
};

export const solanaGameWithQueue = <M, S>(
  solanaChainIo: SolanaGameChainIo<M>,
  socketIoServer: socketIO.Server,
  redisClient: AsyncRedisClient,
  config: SolanaGameConfig<M>,
  eventMethods: SolanaGameWithQueueEvents<M, S>,
  returnConfig = false
): SolanaGameWithQueueEvents<M, S> | void => {
  const timeDiff = getOneOfTimeDiff(config.expiryInterval);
  const globalNamespace: Namespace = io.of(config.gameName as unknown as string);
  const resolvedEventMethods: SolanaGameWithQueueEvents<M, S> = {
    ...solanaGame(solanaChainIo, socketIoServer, config, eventMethods, true),
    async joinQueue({ userPubKey, gameType }, socket) {
      try {
        const readAndDeleteQueue = await getFromQueue(redisClient, timeDiff, config.numUsersInMatch);
        if (readAndDeleteQueue) {
          const { socketIds } = readAndDeleteQueue.reduce((obj, queueItem) => ({
            socketIds: [
              ...obj.socketIds,
              queueItem.socketId
            ],
            userPubKeys: [
              ...obj.userPubKeys,
              queueItem.userPubKey
            ]
          }), { socketIds: [ socket.id ] as string[], userPubKeys: [ userPubKey ] as string[] });
          const matchPubKey = await solanaChainIo.createMatch(gameType);
          // const randomHash = crypto.randomBytes(20).toString("hex")
          // 1. Here we send the secret url to the matched players.
          // 2. When players get theses events, they will be redirected to page /room/xxxx
          // and send socket back to backend "socket.on("joingame")" ask to join a namespace to isolate the events between them.
          const match: MatchedEvent = { matchPubKey };
          for (const socketId of socketIds) {
            globalNamespace.to(socketId).emit("matched", { ...match });
          }
          return;
        }
        const queueItem: QueueItem = {
          userPubKey: userPubKey,
          socketId: socket.id,
          timeOf: Date.now()
        };
        // if queue is empty
        await redisClient.rpush(
          "queue",
          JSON.stringify(queueItem)
        );
      } catch (e) {
        console.error(e);
      }
    },
    ...eventMethods
  };
  if (returnConfig) {
    return resolvedEventMethods;
  }
  createSolanaMatch(config, resolvedEventMethods);
};













