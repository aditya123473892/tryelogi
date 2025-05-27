const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.NODE_ENV === 'production', // Use encryption in production
    trustServerCertificate: process.env.NODE_ENV !== 'production'
  }
};

// Create connection pool
const pool = new sql.ConnectionPool(config);

// Global error handler for database connection
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});

const connectDB = async () => {
  try {
    await pool.connect();
    console.log("✅ Connected to SQL Server -", process.env.DB_NAME);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
};

module.exports = { pool, sql, connectDB };
