import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as pgSchema from "@shared/schema";
import * as mysqlSchema from "@shared/mysql-schema";

// PostgreSQL imports
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Get database type from environment or default to postgres
const databaseType = process.env.DATABASE_TYPE || 'postgres';

// This function will handle connecting to either a PostgreSQL or a MySQL database
// depending on the environment configuration
function setupDatabase() {
  // If we're using MySQL
  if (databaseType === 'mysql') {
    const mysqlUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!mysqlUrl) {
      throw new Error(
        "MYSQL_DATABASE_URL or DATABASE_URL must be set for MySQL connection."
      );
    }
    
    console.log("Using MySQL database connection");
    const poolConnection = mysql.createPool(mysqlUrl);
    return drizzle(poolConnection, { schema: mysqlSchema, mode: 'default' });
  } 
  
  // Default to PostgreSQL
  const pgUrl = process.env.PG_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!pgUrl) {
    throw new Error(
      "PG_DATABASE_URL or DATABASE_URL must be set for PostgreSQL connection."
    );
  }
  
  console.log("Using PostgreSQL database connection");
  const pool = new Pool({ connectionString: pgUrl });
  return drizzlePg({ client: pool, schema: pgSchema });
}

export const db = setupDatabase();
