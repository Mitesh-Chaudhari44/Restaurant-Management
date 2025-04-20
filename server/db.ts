import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as pgSchema from "@shared/schema";
import * as mysqlSchema from "@shared/mysql-schema";

// PostgreSQL imports
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// Set websocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Get database type from environment or default to in-memory
// Setting this to "memory" explicitly will bypass database connection attempts
const databaseType = process.env.DATABASE_TYPE || 'memory';

// We'll export this so other parts of the app know if we're using a real database or not
export let usingRealDatabase = false;

// Helper function to create a dummy DB object that conforms to the Drizzle ORM structure
function createDummyDbObject() {
  console.log("Using in-memory storage for development");
  usingRealDatabase = false;
  return {
    select: () => ({ from: () => ({ where: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) }),
  };
}

// This function will handle connecting to either a PostgreSQL or a MySQL database
// depending on the environment configuration
function setupDatabase() {
  // For explicit in-memory mode, don't even try to connect to a database
  if (databaseType === 'memory') {
    return createDummyDbObject();
  }
  
  try {
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
      usingRealDatabase = true;
      return drizzle(poolConnection, { schema: mysqlSchema, mode: 'default' });
    } 
    
    // Default to PostgreSQL if not MySQL
    const pgUrl = process.env.PG_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!pgUrl) {
      throw new Error(
        "PG_DATABASE_URL or DATABASE_URL must be set for PostgreSQL connection."
      );
    }
    
    console.log("Using PostgreSQL database connection");
    const pool = new Pool({ connectionString: pgUrl });
    
    // Test the connection
    pool.query('SELECT 1').catch(error => {
      console.error("PostgreSQL connection test failed:", error);
      throw error;
    });
    
    usingRealDatabase = true;
    return drizzlePg({ client: pool, schema: pgSchema });
  } catch (error) {
    // If database connection fails, we'll log the error and use a placeholder/dummy DB object
    console.error("Database connection failed:", error);
    return createDummyDbObject();
  }
}

export const db = setupDatabase();
