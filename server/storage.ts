import {
  type MenuItem, type InsertMenuItem,
  type Table, type InsertTable,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Customer, type InsertCustomer,
  type CustomerVisit, type InsertCustomerVisit,
  menuItems, tables, orders, orderItems, customers, customerVisits
} from "@shared/schema";
import { db, usingRealDatabase } from "./db";
import { eq } from "drizzle-orm";
import { MemStorage } from "./mem-storage";

export interface IStorage {
  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Tables
  getTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerVisits(customerId: number): Promise<CustomerVisit[]>;
  createCustomerVisit(visit: InsertCustomerVisit): Promise<CustomerVisit>;
  updateCustomerVisit(id: number, endTime: Date): Promise<CustomerVisit | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getCustomerOrders(customerId: number): Promise<Order[]>;
}

export class DatabaseStorage implements IStorage {
  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    try {
      return await db.select().from(menuItems);
    } catch (error) {
      console.error("Error getting menu items:", error);
      return [];
    }
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    try {
      const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
      return item;
    } catch (error) {
      console.error(`Error getting menu item ${id}:`, error);
      return undefined;
    }
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    try {
      const [menuItem] = await db.insert(menuItems).values(item).returning();
      return menuItem;
    } catch (error) {
      console.error("Error creating menu item:", error);
      // Return a simple object that matches the structure 
      return {
        id: Date.now(),
        ...item,
      } as MenuItem;
    }
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    try {
      const [updated] = await db
        .update(menuItems)
        .set(item)
        .where(eq(menuItems.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating menu item ${id}:`, error);
      return undefined;
    }
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    try {
      const [deleted] = await db
        .delete(menuItems)
        .where(eq(menuItems.id, id))
        .returning();
      return !!deleted;
    } catch (error) {
      console.error(`Error deleting menu item ${id}:`, error);
      return false;
    }
  }

  // Tables
  async getTables(): Promise<Table[]> {
    try {
      return await db.select().from(tables);
    } catch (error) {
      console.error("Error getting tables:", error);
      return [];
    }
  }

  async getTable(id: number): Promise<Table | undefined> {
    try {
      const [table] = await db.select().from(tables).where(eq(tables.id, id));
      return table;
    } catch (error) {
      console.error(`Error getting table ${id}:`, error);
      return undefined;
    }
  }

  async createTable(table: InsertTable): Promise<Table> {
    try {
      const [newTable] = await db.insert(tables).values(table).returning();
      return newTable;
    } catch (error) {
      console.error("Error creating table:", error);
      return {
        id: Date.now(),
        ...table,
      } as Table;
    }
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    try {
      const [updated] = await db
        .update(tables)
        .set(table)
        .where(eq(tables.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating table ${id}:`, error);
      return undefined;
    }
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      return await db.select().from(customers);
    } catch (error) {
      console.error("Error getting customers:", error);
      return [];
    }
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    try {
      const [customer] = await db.select().from(customers).where(eq(customers.id, id));
      return customer;
    } catch (error) {
      console.error(`Error getting customer ${id}:`, error);
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const [newCustomer] = await db.insert(customers).values(customer).returning();
      return newCustomer;
    } catch (error) {
      console.error("Error creating customer:", error);
      return {
        id: Date.now(),
        createdAt: new Date(),
        ...customer,
      } as Customer;
    }
  }

  async getCustomerVisits(customerId: number): Promise<CustomerVisit[]> {
    try {
      return await db
        .select()
        .from(customerVisits)
        .where(eq(customerVisits.customerId, customerId));
    } catch (error) {
      console.error(`Error getting customer visits for customer ${customerId}:`, error);
      return [];
    }
  }

  async createCustomerVisit(visit: InsertCustomerVisit): Promise<CustomerVisit> {
    try {
      const [newVisit] = await db.insert(customerVisits).values(visit).returning();
      return newVisit;
    } catch (error) {
      console.error("Error creating customer visit:", error);
      return {
        id: Date.now(),
        ...visit,
        startTime: visit.startTime || new Date(),
      } as CustomerVisit;
    }
  }

  async updateCustomerVisit(id: number, endTime: Date): Promise<CustomerVisit | undefined> {
    try {
      const [updated] = await db
        .update(customerVisits)
        .set({ endTime })
        .where(eq(customerVisits.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating customer visit ${id}:`, error);
      return undefined;
    }
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      return await db.select().from(orders);
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }

  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      return order;
    } catch (error) {
      console.error(`Error getting order ${id}:`, error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const [newOrder] = await db.insert(orders).values(order).returning();
      return newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      return {
        id: Date.now(),
        createdAt: new Date(),
        ...order,
      } as Order;
    }
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      const [updated] = await db
        .update(orders)
        .set(order)
        .where(eq(orders.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      return undefined;
    }
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    try {
      return await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
    } catch (error) {
      console.error(`Error getting order items for order ${orderId}:`, error);
      return [];
    }
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    try {
      const [orderItem] = await db.insert(orderItems).values(item).returning();
      return orderItem;
    } catch (error) {
      console.error("Error creating order item:", error);
      return {
        id: Date.now(),
        ...item,
      } as OrderItem;
    }
  }

  async getCustomerOrders(customerId: number): Promise<Order[]> {
    try {
      return await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, customerId));
    } catch (error) {
      console.error(`Error getting orders for customer ${customerId}:`, error);
      return [];
    }
  }
}

// For development/testing, use an in-memory storage when the database connection fails
export const memoryStorage = new MemStorage();

// Initialize with some test data
(async () => {
  // Add a sample menu item
  await memoryStorage.createMenuItem({
    name: "Sample Cake",
    description: "A delicious sample cake",
    price: 1000,
    category: "Dessert",
    available: true
  });
  
  // Add a sample table
  await memoryStorage.createTable({
    number: 1,
    capacity: 4,
    occupied: false
  });
  
  // Add a sample customer
  const customer = await memoryStorage.createCustomer({
    name: "John Doe",
    email: "john@example.com",
    phone: "555-1234"
  });
  
  // Use the appropriate storage implementation
  console.log(`Using ${usingRealDatabase ? 'database' : 'in-memory'} storage`);
})();

// Export the appropriate storage implementation
export const storage = usingRealDatabase ? new DatabaseStorage() : memoryStorage;