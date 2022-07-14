import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Result } from "../../../front/src/use-solana-game/utils/shared_types";

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>>
  & {
  [K in Keys]-?:
  Required<Pick<T, K>>
  & Partial<Record<Exclude<Keys, K>, undefined>>
}[Keys];

export const getOneOfTimeDiff = (timeDiff: RequireOnlyOne<TimeArgs>) => {
  const timeArgsArr = Object.entries(timeDiff) as [ keyof TimeArgs, TimeArgs[keyof TimeArgs] ][];
  const numTimeArgs = timeArgsArr.length;
  if (numTimeArgs > 1 || numTimeArgs <= 0) {
    throw new Error(`got object with incorrect # of properties not undefined for isExpired, expected only one of secs, minutes, hours, or days`);
  }
  const [ typeTime, amount ] = timeArgsArr[0];
  return { typeTime, amount };
};

export type TimeArgs = { secs: number, minutes: number, hours: number, days: number };
export const getTimeDiffFn = (key: keyof TimeArgs): typeof differenceInMinutes => {
  // tslint:disable-next-line:switch-default
  switch (key) {
    case "secs":
      return differenceInSeconds;
    case "minutes":
      return differenceInMinutes;
    case "hours":
      return differenceInHours;
    case "days":
      return differenceInDays;
    default:
      return differenceInMinutes;
  }
};


export const sleep = async (duration: number) => await new Promise(r => setTimeout(r, duration));

export const unwrapResult = <T>(result: Result<T>): T => {
  if (result instanceof Error) {
    console.error(result);
    process.exit(1);
  }
  return result;
};

