import { AsyncRedisClient } from "async-redis";
import { getTimeDiffFn, TimeArgs } from "./general";
import { Option } from "../../../front/src/use-solana-game/utils/shared_types";
import { QueueItem } from "../../event_types";


export const getFromQueue = async (
  redisClient: AsyncRedisClient,
  timeDiff: { typeTime: keyof TimeArgs, amount: number },
  numUsersInMatch: {
    min: number,
    max: number
  }
): Promise<Option<QueueItem[]>> => {
  const queueLength = await redisClient.llen(`queue`);
  if (queueLength >= numUsersInMatch.min && queueLength <= numUsersInMatch.max) {
    const readAndDeleteQueue = await redisClient.lrange(`queue`, 0, numUsersInMatch.max);
    const parseQueue = (q: string[]) => q.map(x => JSON.parse(x) as QueueItem);
    const parsedQueue = parseQueue(readAndDeleteQueue)
      .filter(x => getTimeDiffFn(timeDiff.typeTime)(new Date(), new Date(x.timeOf)) <= timeDiff.amount);
    let numStale = readAndDeleteQueue.length - parsedQueue.length;
    if (numStale > 0) {
      const nextRound = await getFromQueue(
        redisClient,
        timeDiff, {
          min: numUsersInMatch.min - parsedQueue.length,
          max: numUsersInMatch.max - numStale
        });
      if (nextRound) {
        return [
          ...parsedQueue,
          ...nextRound
        ];
      }
    }
    return parsedQueue;
  }
};
