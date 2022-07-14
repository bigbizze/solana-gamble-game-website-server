import express from "express";
import socketIO from "socket.io";
import asyncRedis from "async-redis";
import { buildSolanaServer } from "./build-solana-server";

const app = express();
const server = require("http").createServer(app);
app.use(require("cors")());

export const redisClient = asyncRedis.createClient(
  process.env.REDIS_URL,
  {
    password: process.env.REDIS_PASSWORD
  }
);

export const io = new socketIO.Server(server, {
  path: "/",
  cors: {
    origin: "*"
  }
});

redisClient.flushall().catch(console.error);

buildSolanaServer(redisClient, io);


server.listen(5000, () => {
  console.log("listening on *:5000");
});
