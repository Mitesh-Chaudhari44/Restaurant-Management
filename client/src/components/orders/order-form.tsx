import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import type { InsertOrder, InsertOrderItem, MenuItem, Table, Customer, Order, OrderItem } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, PlusCircle, DollarSign } from "lucide-react";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderFormProps {
  tables: Table[];
  menuItems: MenuItem[];
  customers: Customer[];
  existingOrders?: Order[];
  orderItems?: { [orderId: string]: OrderItem[] };
  onSubmit: (order: InsertOrder, items: InsertOrderItem[]) => Promise<void>;
}

export function OrderForm({ 
  tables, 
  menuItems, 
  customers, 
  existingOrders = [], 
  orderItems = {}, 
  onSubmit 
}: OrderFormProps) {
  const { toast } = useToast();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  // Calculate order total
  const calculateOrderTotal = (items: { menuItemId: number; quantity: number; price?: number }[]) => {
    return items.reduce((sum, item) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      return sum + ((menuItem?.price || 0) * item.quantity);
    }, 0);
  };
  
  const form = useForm<InsertOrder & { items: InsertOrderItem[] }>({
    resolver: zodResolver(
      insertOrderSchema.extend({
        items: insertOrderItemSchema.omit({ orderId: true }).array(),
      })
    ),
    defaultValues: {
      customerId: 0,
      tableId: 0,
      status: "pending",
      totalAmount: 0,
      items: [],
    },
  });

  // Filter tables based on customer assignment
  const getCustomerTables = () => {
    const customerId = selectedCustomerId;
    if (!customerId) return tables;
    
    // If no customer is selected, show all tables
    // Otherwise, show tables that are either unoccupied or occupied by this customer
    return tables.filter(table => 
      !table.occupied || 
      existingOrders.some(order => 
        order.customerId === customerId && 
        order.tableId === table.id && 
        order.status !== "completed"
      )
    );
  };

  // Get all existing orders for a specific table
  const getTableOrders = () => {
    if (!selectedTableId) return [];
    return existingOrders.filter(order => 
      order.tableId === selectedTableId && 
      order.status !== "completed"
    );
  };

  // When customer changes, reset table selection if it's not valid for this customer
  useEffect(() => {
    const customerId = form.getValues("customerId");
    const tableId = form.getValues("tableId");
    
    if (customerId && tableId) {
      const validTables = getCustomerTables().map(t => t.id);
      if (!validTables.includes(tableId)) {
        form.setValue("tableId", 0);
        setSelectedTableId(null);
      }
    }
  }, [selectedCustomerId, tables, existingOrders]);

  const handleSubmit = async (data: InsertOrder & { items: InsertOrderItem[] }) => {
    try {
      const { items, ...order } = data;

      if (items.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one item to the order",
          variant: "destructive",
        });
        return;
      }

      // Calculate total amount from items
      const totalAmount = calculateOrderTotal(items);

      // Create the order with calculated total
      const orderData: InsertOrder = {
        ...order,
        totalAmount,
      };

      // Set the price for each item based on the menu item price
      const itemsWithPrice = items.map(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        return {
          ...item,
          price: menuItem?.price || 0,
        };
      });

      await onSubmit(orderData, itemsWithPrice);
      form.reset();
      setSelectedTableId(null);
      setSelectedCustomerId(null);
      
      toast({
        title: "Success",
        description: "Order created successfully",
      });
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  // Get the selected table details
  const selectedTable = tables.find(t => t.id === selectedTableId);
  
  // Get existing orders for the selected table
  const tableOrders = getTableOrders();
  
  // Calculate current order total (for display purposes)
  const currentItems = form.watch("items");
  const currentOrderTotal = calculateOrderTotal(currentItems);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const parsedValue = parseInt(value);
                      field.onChange(parsedValue);
                      setSelectedCustomerId(parsedValue);
                    }}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} ({customer.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const parsedValue = parseInt(value);
                      field.onChange(parsedValue);
                      setSelectedTableId(parsedValue);
                    }}
                    defaultValue={field.value.toString()}
                    disabled={!selectedCustomerId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getCustomerTables().map((table) => (
                        <SelectItem 
                          key={table.id} 
                          value={table.id.toString()}
                        >
                          Table {table.number} {table.occupied ? "(Occupied)" : "(Available)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedCustomerId && (
                    <FormDescription>Select a customer first</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedTableId && selectedTable && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Table #{selectedTable.number} Details
                </CardTitle>
                <CardDescription>
                  Capacity: {selectedTable.capacity} | Status: {selectedTable.occupied ? "Occupied" : "Available"}
                </CardDescription>
              </CardHeader>
              {tableOrders.length > 0 && (
                <CardContent>
                  <h3 className="text-sm font-medium mb-2">Current Orders for this Table:</h3>
                  <TableComponent className="bg-white">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableOrders.map(order => {
                        const customer = customers.find(c => c.id === order.customerId);
                        const orderItemCount = orderItems[order.id]?.length || 0;
                        
                        return (
                          <TableRow key={order.id}>
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>{customer?.name || 'Unknown'}</TableCell>
                            <TableCell>{orderItemCount} items</TableCell>
                            <TableCell className="text-right">₹{order.totalAmount}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {order.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </TableComponent>
                </CardContent>
              )}
            </Card>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Order Items</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  form.setValue("items", [
                    ...form.watch("items"),
                    { menuItemId: 0, quantity: 1, price: 0 },
                  ])
                }
                disabled={!selectedTableId}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {!selectedTableId ? (
              <div className="text-center p-6 bg-muted/30 rounded-md">
                Please select a table to add order items
              </div>
            ) : form.watch("items").length === 0 ? (
              <div className="text-center p-6 bg-muted/30 rounded-md">
                No items added to this order yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-3 bg-muted/30 p-4 rounded-md">
                {form.watch("items").map((_, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded-md">
                    <FormField
                      control={form.control}
                      name={`items.${index}.menuItemId`}
                      render={({ field }) => (
                        <FormItem className="col-span-6">
                          <FormLabel>Menu Item</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(parseInt(value));
                              // Update price when menu item changes
                              const menuItem = menuItems.find(m => m.id === parseInt(value));
                              if (menuItem) {
                                form.setValue(`items.${index}.price`, menuItem.price);
                              }
                            }}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {menuItems.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name} (₹{(item.price / 100).toFixed(2)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="col-span-2 text-right">
                      {(() => {
                        const menuItemId = form.watch(`items.${index}.menuItemId`);
                        const quantity = form.watch(`items.${index}.quantity`) || 0;
                        const menuItem = menuItems.find(m => m.id === menuItemId);
                        const price = (menuItem?.price || 0) * quantity;
                        return (
                          <div className="text-sm">
                            <div className="font-medium">Price</div>
                            <div>₹{(price / 100).toFixed(2)}</div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => {
                          const items = form.watch("items");
                          form.setValue(
                            "items",
                            items.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end p-2">
                  <div className="text-lg font-medium flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    Total: ₹{(currentOrderTotal / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={
              !selectedTableId || 
              form.watch("items").length === 0 || 
              form.watch("items").some(item => !item.menuItemId || !item.quantity)
            }
          >
            Create Order
          </Button>
        </form>
      </Form>
    </div>
  );
}