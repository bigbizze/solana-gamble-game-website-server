import React, { useMemo } from "react";
import ReactDOM from "react-dom";
import Router from "./Router";
import "./index.css";
import "tailwindcss/tailwind.css";
import { ConnectionProvider, WalletProvider, } from "@solana/wallet-adapter-react";
import {
  getLedgerWallet,
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

const SolanaProvider = () => {
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getLedgerWallet(),
      getSolongWallet(),
      getMathWallet(),
      getSolletWallet(),
    ],
    []
  );

  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

  return (
    <ConnectionProvider endpoint={ endpoint }>
      <WalletProvider wallets={ wallets }>
        <Router/>
      </WalletProvider>
    </ConnectionProvider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <SolanaProvider/>
  </React.StrictMode>,
  document.getElementById("root")
);
