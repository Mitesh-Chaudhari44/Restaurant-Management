import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as schema from "../shared/mysql-schema";

/**
 * This script creates the MySQL database schema
 * Run with: ts-node server/mysql-setup.ts
 */

async function setupMysqlSchema() {
  console.log("Setting up MySQL database schema...");
  
  // Check for MySQL connection URL
  const mysqlUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!mysqlUrl) {
    throw new Error("MYSQL_DATABASE_URL or DATABASE_URL environment variable is required.");
  }
  
  // Connect to MySQL
  console.log("Connecting to MySQL database...");
  const connection = mysql.createPool(mysqlUrl);
  const db = drizzle(connection, { schema, mode: 'default' });
  
  try {
    // Create schema for all tables
    console.log("Creating tables...");
    
    // Create menu_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        available BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Create tables table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number INT NOT NULL UNIQUE,
        capacity INT NOT NULL,
        occupied BOOLEAN DEFAULT FALSE,
        arrival_time TIMESTAMP NULL
      )
    `);
    
    // Create customers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create customer_visits table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customer_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        table_id INT NOT NULL,
        start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NULL
      )
    `);
    
    // Create orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        table_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        total_amount INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        menu_item_id INT NOT NULL,
        quantity INT NOT NULL,
        price INT NOT NULL
      )
    `);
    
    console.log("MySQL schema setup completed successfully!");
  } catch (error) {
    console.error("Error setting up MySQL schema:", error);
    throw error;
  } finally {
    // Close connection
    await connection.end();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  setupMysqlSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("MySQL schema setup failed:", error);
      process.exit(1);
    });
}

export { setupMysqlSchema };