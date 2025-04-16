import { mysqlTable, varchar, int, boolean, decimal, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// MySQL schema definitions - these will replace the PostgreSQL schema when we're ready
export const menuItems = mysqlTable("menu_items", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
  price: int("price").notNull(), 
  category: varchar("category", { length: 100 }).notNull(),
  available: boolean("available").default(true),
});

export const tables = mysqlTable("tables", {
  id: int("id").primaryKey().autoincrement(),
  number: int("number").notNull().unique(),
  capacity: int("capacity").notNull(),
  occupied: boolean("occupied").default(false),
  arrivalTime: timestamp("arrival_time"),
});

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerVisits = mysqlTable("customer_visits", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(),
  tableId: int("table_id").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
});

export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(), 
  tableId: int("table_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(), 
  totalAmount: int("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id").notNull(),
  menuItemId: int("menu_item_id").notNull(),
  quantity: int("quantity").notNull(),
  price: int("price").notNull(),
});

// All schemas below can remain the same as the PostgreSQL version since they're database-agnostic
export const insertMenuItemSchema = createInsertSchema(menuItems)
  .omit({ id: true })
  .extend({
    price: z.number().int("Price must be a whole number").positive("Price must be positive"),
  });
export const insertTableSchema = createInsertSchema(tables).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertCustomerVisitSchema = createInsertSchema(customerVisits).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders)
  .omit({ id: true, createdAt: true })
  .extend({
    totalAmount: z.number().int().nonnegative(),
  });
export const insertOrderItemSchema = createInsertSchema(orderItems)
  .omit({ id: true })
  .extend({
    price: z.number().int().nonnegative(),
  });

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerVisit = typeof customerVisits.$inferSelect;
export type InsertCustomerVisit = z.infer<typeof insertCustomerVisitSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;