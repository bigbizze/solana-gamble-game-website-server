import { Dispatch, SetStateAction } from "react";

export type Option<T, N extends void | null | undefined = undefined> = T | N;
export type Result<T> = T | Error;
export type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type TDispatch<T> = Dispatch<SetStateAction<T>>;
