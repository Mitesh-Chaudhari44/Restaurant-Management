import mysql from 'mysql2/promise';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import * as pgSchema from "../shared/schema";
import * as mysqlSchema from "../shared/mysql-schema";

/**
 * This script can be used to migrate data from PostgreSQL to MySQL
 * Run with: ts-node server/migration.ts
 */

async function migratePgToMysql() {
  console.log("Starting migration from PostgreSQL to MySQL...");
  
  // Check for environment variables
  if (!process.env.PG_DATABASE_URL) {
    throw new Error("PG_DATABASE_URL is required for migration.");
  }
  
  if (!process.env.MYSQL_DATABASE_URL) {
    throw new Error("MYSQL_DATABASE_URL is required for migration.");
  }
  
  // Connect to PostgreSQL
  console.log("Connecting to PostgreSQL database...");
  const pgPool = new Pool({ connectionString: process.env.PG_DATABASE_URL });
  const pgDb = drizzlePg({ client: pgPool, schema: pgSchema });
  
  // Connect to MySQL
  console.log("Connecting to MySQL database...");
  const mysqlPool = mysql.createPool(process.env.MYSQL_DATABASE_URL);
  const mysqlDb = drizzleMysql(mysqlPool, { schema: mysqlSchema, mode: 'default' });
  
  try {
    // Migrate menu items
    console.log("Migrating menu items...");
    const menuItems = await pgDb.select().from(pgSchema.menuItems);
    if (menuItems.length > 0) {
      await mysqlDb.insert(mysqlSchema.menuItems).values(menuItems);
    }
    
    // Migrate tables
    console.log("Migrating tables...");
    const tables = await pgDb.select().from(pgSchema.tables);
    if (tables.length > 0) {
      await mysqlDb.insert(mysqlSchema.tables).values(tables);
    }
    
    // Migrate customers
    console.log("Migrating customers...");
    const customers = await pgDb.select().from(pgSchema.customers);
    if (customers.length > 0) {
      await mysqlDb.insert(mysqlSchema.customers).values(customers);
    }
    
    // Migrate customer visits
    console.log("Migrating customer visits...");
    const customerVisits = await pgDb.select().from(pgSchema.customerVisits);
    if (customerVisits.length > 0) {
      await mysqlDb.insert(mysqlSchema.customerVisits).values(customerVisits);
    }
    
    // Migrate orders
    console.log("Migrating orders...");
    const orders = await pgDb.select().from(pgSchema.orders);
    if (orders.length > 0) {
      await mysqlDb.insert(mysqlSchema.orders).values(orders);
    }
    
    // Migrate order items
    console.log("Migrating order items...");
    const orderItems = await pgDb.select().from(pgSchema.orderItems);
    if (orderItems.length > 0) {
      await mysqlDb.insert(mysqlSchema.orderItems).values(orderItems);
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    // Close connections
    pgPool.end();
    await mysqlPool.end();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  migratePgToMysql()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migratePgToMysql };