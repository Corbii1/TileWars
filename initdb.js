const { Pool } = require("pg");
const fs = require("fs");



const pool = new pg.Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  password: process.env.PGPASS,
  ssl: { rejectUnauthorized: false }
});


