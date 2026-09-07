import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "panaderia_amapola",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
