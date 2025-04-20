import {
  MenuItem, InsertMenuItem,
  Table, InsertTable,
  Customer, InsertCustomer,
  CustomerVisit, InsertCustomerVisit,
  Order, InsertOrder,
  OrderItem, InsertOrderItem
} from "@shared/schema";
import { IStorage } from "./storage";

// In-memory storage implementation as a fallback when database is unavailable
export class MemStorage implements IStorage {
  private menuItems: MenuItem[] = [];
  private tables: Table[] = [];
  private customers: Customer[] = [];
  private customerVisits: CustomerVisit[] = [];
  private orders: Order[] = [];
  private orderItems: OrderItem[] = [];
  private idCounters = {
    menuItems: 1,
    tables: 1,
    customers: 1,
    customerVisits: 1,
    orders: 1,
    orderItems: 1
  };

  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    return this.menuItems;
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.find(item => item.id === id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const newItem = {
      ...item,
      id: this.idCounters.menuItems++
    } as MenuItem;
    this.menuItems.push(newItem);
    return newItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const index = this.menuItems.findIndex(mi => mi.id === id);
    if (index === -1) return undefined;
    
    this.menuItems[index] = {
      ...this.menuItems[index],
      ...item
    };
    return this.menuItems[index];
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const initialLength = this.menuItems.length;
    this.menuItems = this.menuItems.filter(item => item.id !== id);
    return initialLength !== this.menuItems.length;
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return this.tables;
  }

  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.find(table => table.id === id);
  }

  async createTable(table: InsertTable): Promise<Table> {
    const newTable = {
      ...table,
      id: this.idCounters.tables++
    } as Table;
    this.tables.push(newTable);
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const index = this.tables.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.tables[index] = {
      ...this.tables[index],
      ...table
    };
    return this.tables[index];
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return this.customers;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.find(customer => customer.id === id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const newCustomer = {
      ...customer,
      id: this.idCounters.customers++,
      createdAt: new Date()
    } as Customer;
    this.customers.push(newCustomer);
    return newCustomer;
  }

  async getCustomerVisits(customerId: number): Promise<CustomerVisit[]> {
    return this.customerVisits.filter(visit => visit.customerId === customerId);
  }

  async createCustomerVisit(visit: InsertCustomerVisit): Promise<CustomerVisit> {
    const newVisit = {
      ...visit,
      id: this.idCounters.customerVisits++,
      startTime: visit.startTime || new Date()
    } as CustomerVisit;
    this.customerVisits.push(newVisit);
    return newVisit;
  }

  async updateCustomerVisit(id: number, endTime: Date): Promise<CustomerVisit | undefined> {
    const index = this.customerVisits.findIndex(visit => visit.id === id);
    if (index === -1) return undefined;
    
    this.customerVisits[index] = {
      ...this.customerVisits[index],
      endTime
    };
    return this.customerVisits[index];
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return this.orders;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.find(order => order.id === id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder = {
      ...order,
      id: this.idCounters.orders++,
      createdAt: new Date()
    } as Order;
    this.orders.push(newOrder);
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    
    this.orders[index] = {
      ...this.orders[index],
      ...order
    };
    return this.orders[index];
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.orderItems.filter(item => item.orderId === orderId);
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const newItem = {
      ...item,
      id: this.idCounters.orderItems++
    } as OrderItem;
    this.orderItems.push(newItem);
    return newItem;
  }

  async getCustomerOrders(customerId: number): Promise<Order[]> {
    return this.orders.filter(order => order.customerId === customerId);
  }
}