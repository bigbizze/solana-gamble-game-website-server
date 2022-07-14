import mariadb, { PoolConnection } from "mariadb";

// const timezone = new Date().toString().split(" ").reduce((a, b) => a.includes("-") ? a : b);
const timezone = new Date().toString().split(" ").reduce((a, b) => a.includes("-") || a.includes("+") ? a : b);

const maria_pool = mariadb.createPool({
  database: "solana",
  host: '155.138.132.23',
  port: 3306,
  user: 'solana',
  password: 'db-solana-game',
  timezone,
  connectionLimit: 25
});

const db_conn = (): Promise<PoolConnection> => maria_pool.getConnection();

export default db_conn;
