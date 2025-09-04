const { Pool } = require("pg");

const sql = `CREATE TABLE IF NOT EXISTS board (
	x INT NOT NULL,
	y INT NOT NULL,
	color VARCHAR(15)
);
CREATE TABLE IF NOT EXISTS messages (
	name TEXT NOT NULL,
	text TEXT NOT NULL,
	color VARCHAR(15) DEFAULT 'gray',
	timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS players (
	id TEXT NOT NULL,
	color VARCHAR(15),
	x INT NOT NULL,
	y INT NOT NULL,
	alive BOOLEAN DEFAULT TRUE
);`;

const pool = new pg.Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  password: process.env.PGPASS,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(sql);
    console.log("Database initialized successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1);
  }
})();
