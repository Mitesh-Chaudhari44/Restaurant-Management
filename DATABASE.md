# Database Configuration Guide

This application supports both PostgreSQL and MySQL databases, and can be configured to use either one.

## Current Configuration

The application is currently set up to use PostgreSQL by default, as it's already configured in the Replit environment. However, all the necessary code to switch to MySQL has been implemented.

## How to Switch Between Databases

### Using PostgreSQL (Default)

PostgreSQL is already set up in your Replit environment. No additional configuration is needed.

```
# In .env file
DATABASE_TYPE=postgres
```

### Using MySQL

To switch to MySQL, you need:

1. An external MySQL database (Replit doesn't support installing MySQL locally)
2. Update your environment variables to include MySQL connection details

```
# In .env file
DATABASE_TYPE=mysql
MYSQL_DATABASE_URL=mysql://username:password@hostname:port/database_name
```

## Database Migration

If you want to migrate your data from PostgreSQL to MySQL:

1. Set up both database connections in your environment variables:
   ```
   PG_DATABASE_URL=postgres://your-pg-connection-string
   MYSQL_DATABASE_URL=mysql://your-mysql-connection-string
   ```

2. Run the MySQL setup script to create the tables:
   ```
   npx tsx server/mysql-setup.ts
   ```

3. Run the migration script to copy data from PostgreSQL to MySQL:
   ```
   npx tsx server/migration.ts
   ```

4. Change your DATABASE_TYPE to 'mysql' in the .env file

## Database Schema

The database schema is defined in two separate files:

- `shared/schema.ts` - PostgreSQL schema
- `shared/mysql-schema.ts` - MySQL schema

Both schemas define the same tables and relationships, just using the appropriate database-specific types.

## Tables

The database includes the following tables:

1. **menu_items** - Menu items available in the restaurant
2. **tables** - Restaurant tables with capacity information
3. **customers** - Customer information
4. **customer_visits** - Tracks when customers visit and which table they use
5. **orders** - Customer orders
6. **order_items** - Individual items in an order

## Connection Configuration

The database connection is set up in `server/db.ts` and automatically detects which database type to use based on the DATABASE_TYPE environment variable.