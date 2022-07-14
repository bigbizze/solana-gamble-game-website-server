import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuid } from 'uuid';
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton, } from "@solana/wallet-adapter-react-ui";
import base64url from "base64url";
import { Board } from "../components";
import { PublicKey } from "@solana/web3.js";
import { useSolanaGame } from "../use-solana-game";
import { LeaveGame, MatchedEvent, MatchFinished, RpcUserAddedToMatch } from "../event_types";
import { Option, TDispatch } from "../use-solana-game/utils/shared_types";

const namespaceGlobal = io("http://localhost:5000/");

const rows: string[] = new Array(6).fill("0");
const cols: string[][] = new Array(7).fill(rows);

const makeJoinQueue = (queueJoined: number, setQueueJoined: TDispatch<number>) => (address: PublicKey) => {
  if (queueJoined < 5) {
    setQueueJoined(queueJoined + 1);
    namespaceGlobal.emit("helloWorld", { hello: "world", world: "hello" });
    const e = { gameKey: "helloGuys", otherStuff: "yololo" };
    console.log(e);
    namespaceGlobal.emit("joinGame", e);
  }
};

export type Grid = string[][];

export type TokenBal = {
  userGameTokenBal: string
  userTokenBal: string
};

const Homepage = () => {
  const walletContextState = useWallet();
  // const { connection } = useConnection();
  const { wallet, connect, connecting, connected, publicKey } = walletContextState;
  const [ matchPubKey, setMatchPubKey ] = useState<Option<string>>();
  const [ userGameTokenBal, setUserGameTokenBal ] = useState<TokenBal>({
    userGameTokenBal: "0",
    userTokenBal: "0"
  });
  const [ grid, setGrid ] = useState<Grid>(cols);
  const [ queueJoined, setQueueJoined ] = useState(0);
  const joinQueue = makeJoinQueue(queueJoined, setQueueJoined);
  const emitPlay = (updatedGrid: Grid) => {
    namespaceGlobal.emit("gameflow", {
      matchPubKey,
      address: publicKey,
      updatedGrid,
    });
  };
  const { addUserToMatch, userTokenBalance, updateUserBalance } = useSolanaGame(25);
  // FLOW wallet
  useEffect(() => {
    if (connected && publicKey) {
      console.log("publicKey", publicKey.toString());
      namespaceGlobal.on("updateMatch", setGrid);
      namespaceGlobal.on("matchFinished", ({ winningUserPubKey, winnings }: MatchFinished) => {
        if (winningUserPubKey === publicKey.toString()) {
          /** This is ghetto as hell and is just for testing atm
           */
          setUserGameTokenBal(({ userGameTokenBal, userTokenBal }) => ({
            userTokenBal: `${ Number(userTokenBal) + winnings }`,
            userGameTokenBal
          }));
          alert(`you won: ${ winnings }!`);
        } else {
          setUserGameTokenBal(({ userGameTokenBal, userTokenBal }) => ({
            userTokenBal: `${ Number(userTokenBal) - winnings }`,
            userGameTokenBal
          }));
          alert(`the winner won ${ winnings } :(`);
        }
      });
    }
  }, [ wallet, connected ]);
  // FLOW websocket
  useEffect(() => {
    namespaceGlobal.connect();
    namespaceGlobal.on("connect", () => {
      if (namespaceGlobal.disconnected) {
        console.log("-- disconnect flow --");
        return;
      }
      namespaceGlobal.emit("config", uuid());
      return console.log("connect success: ", namespaceGlobal.connected);
    });
  }, []);

  const [ userAdded, setUserAdded ] = useState(false);
  useEffect(() => {
    if (namespaceGlobal.disconnected) {
      return;
    }
    namespaceGlobal.on("matched", async ({ matchPubKey }: MatchedEvent) => {
      if (userAdded) {
        return;
      }
      setUserAdded(true);
      const url = base64url(matchPubKey);
      // joingame emit = join this socket in namespace
      namespaceGlobal.emit("joingame", url);
      setMatchPubKey(url);
      /** TODO: update this to use context state, this will fail currently */
      const rpcMatchResult: any = await addUserToMatch(matchPubKey);
      if (!rpcMatchResult) {
        return;
      }
      const { userMatchTokenPubKey, userTokenPubKey } = rpcMatchResult;
      const rpcUserAdded: RpcUserAddedToMatch = {
        matchPubKey,
        userPubKey: publicKey.toString(),
        userTokenPubKey,
        userMatchTokenPubKey
      };
      namespaceGlobal.emit("joinsuccess", rpcUserAdded);
    });
  }, [ addUserToMatch ]);

  const onLeaveGame = useCallback(() => {
    const leaveGameArgs: LeaveGame = {
      userPubKey: publicKey.toString(),
      matchPubKey
    };
    namespaceGlobal.emit("leavegame", leaveGameArgs);
    setMatchPubKey(undefined);
  }, [ publicKey, matchPubKey ]);

  if (matchPubKey && publicKey != null)
    return (
      <Board
        userGameTokenBal={ userGameTokenBal }
        onLeaveGame={ onLeaveGame }
        grid={ grid }
        setGrid={ setGrid }
        myAddress={ publicKey.toString() }
        emitPlay={ emitPlay }
      />
    );
  // TODO: remove style prop
  return (
    <>
      <div
        style={ {
          zIndex: 99,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        } }
      >
        <h1
          style={ {
            fontSize: "4rem",
            color: "white",
            textShadow:
              "0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073",
          } }
        >
          GAME START
        </h1>
        <WalletModalProvider>
          <WalletMultiButton/>
        </WalletModalProvider>
        { connected && publicKey && (
          <div
            onClick={ () => joinQueue(publicKey) }
            className="mt-2"
            style={ {
              cursor: "pointer",
              fontSize: "2rem",
              color: "white",
              textShadow:
                "0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073",
            } }
          >
            join a game
          </div>
        ) }
      </div>
      { " " }
    </>
  );
};

export default Homepage;
