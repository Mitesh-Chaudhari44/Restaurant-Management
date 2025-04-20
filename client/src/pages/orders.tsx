import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type Order, type MenuItem, type Table, type OrderItem, type Customer } from "@shared/schema";
import { OrderForm } from "@/components/orders/order-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, RefreshCcw, Utensils, Timer, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Orders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItemsCache, setOrderItemsCache] = useState<{ [orderId: string]: OrderItem[] }>({});

  // Load all orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Load menu items
  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Load tables
  const { data: tables, isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  // Load customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Load order items for all orders
  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!orders) return;
      
      const orderItemsObj: { [orderId: string]: OrderItem[] } = {};
      
      for (const order of orders) {
        try {
          const response = await fetch(`/api/orders/${order.id}`);
          const data = await response.json();
          if (data.items) {
            orderItemsObj[order.id] = data.items;
          }
        } catch (error) {
          console.error(`Error fetching items for order ${order.id}:`, error);
        }
      }
      
      setOrderItemsCache(orderItemsObj);
    };
    
    fetchOrderItems();
  }, [orders]);

  // Mutation to create a new order
  const createOrderMutation = useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<Order, "id" | "createdAt">;
      items: Omit<OrderItem, "id" | "orderId">[];
    }) => {
      // Get table info to check if it's occupied
      const tableInfo = tables.find(t => t.id === order.tableId);
      
      // If table is occupied, find existing customer from active orders
      if (tableInfo?.occupied && order.customerId === 0) {
        const tableOrders = orders?.filter(o => 
          o.tableId === order.tableId && 
          o.status !== "completed"
        );
        
        if (tableOrders && tableOrders.length > 0) {
          // Use the customerId from existing order for this table
          order.customerId = tableOrders[0].customerId;
        }
      }
      
      // Create order
      const createdOrder = await apiRequest("POST", "/api/orders", order);
      const orderData = await createdOrder.json();

      // Create order items
      await Promise.all(
        items.map((item) =>
          apiRequest("POST", `/api/orders/${orderData.id}/items`, item)
        )
      );

      // Create a customer visit record when an order is created
      if (order.customerId && order.tableId) {
        // Check if customer already has an active visit
        const visits = await apiRequest("GET", `/api/customers/${order.customerId}/visits`);
        const visitsData = await visits.json();
        const hasActiveVisit = visitsData.some((v: any) => 
          !v.endTime && v.tableId === order.tableId
        );
        
        // Only create a new visit if one doesn't exist
        if (!hasActiveVisit) {
          await apiRequest("POST", `/api/customers/${order.customerId}/visits`, {
            tableId: order.tableId,
            startTime: new Date(),
          });
        }
        
        // Update table status to occupied
        await apiRequest("PATCH", `/api/tables/${order.tableId}`, {
          occupied: true
        });
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Order created",
        description: "New order has been created successfully.",
      });
    },
  });

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/orders/${id}`, { status });

      // When order is completed, end the customer visit and update table
      if (status === "completed") {
        const order = orders?.find(o => o.id === id);
        if (order) {
          // Check if there are other active orders for this table
          const otherActiveOrders = orders?.filter(o => 
            o.id !== id && 
            o.tableId === order.tableId && 
            o.status !== "completed"
          );
          
          // Only update table and end visit if this is the last active order
          if (otherActiveOrders && otherActiveOrders.length === 0) {
            // Update table status to available
            await apiRequest("PATCH", `/api/tables/${order.tableId}`, {
              occupied: false
            });
            
            // End the customer visit
            const visits = await apiRequest("GET", `/api/customers/${order.customerId}/visits`);
            const visitsData = await visits.json();
            const activeVisit = visitsData.find((v: any) => !v.endTime && v.tableId === order.tableId);
            if (activeVisit) {
              await apiRequest("PATCH", `/api/customer-visits/${activeVisit.id}/end`);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
  });

  // Handle loading states
  if (ordersLoading || menuItemsLoading || tablesLoading || customersLoading) {
    return <div>Loading...</div>;
  }

  if (!menuItems || !tables || !customers) {
    return <div>Error loading data</div>;
  }

  // Utility function to get status color
  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      preparing: "bg-blue-100 text-blue-800",
      served: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Format price as currency
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  // Get active and completed orders
  const activeOrders = orders?.filter(order => order.status !== "completed") || [];
  const completedOrders = orders?.filter(order => order.status === "completed") || [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Select a table and add menu items to create a new order.
              </DialogDescription>
            </DialogHeader>
            <OrderForm
              tables={tables}
              menuItems={menuItems}
              customers={customers}
              existingOrders={orders || []}
              orderItems={orderItemsCache}
              onSubmit={async (order, items) => {
                await createOrderMutation.mutateAsync({ order, items });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Orders ({completedOrders.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map((order) => {
              const customer = customers.find((c) => c.id === order.customerId);
              const table = tables.find((t) => t.id === order.tableId);
              const itemsCount = orderItemsCache[order.id]?.length || 0;
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>Order #{order.id}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`capitalize px-2 py-1 ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Utensils className="h-3.5 w-3.5 mr-1" />
                          Table
                        </div>
                        <div className="font-medium">Table #{table?.number || "Unknown"}</div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">{itemsCount} items</div>
                          <div className="font-bold">{formatPrice(order.totalAmount)}</div>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            View Order Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Order #{order.id} Details</DialogTitle>
                            <DialogDescription>
                              Table #{table?.number} • {order.status}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {orderItemsCache[order.id] ? (
                            <TableComponent>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-center">Qty</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orderItemsCache[order.id].map((item) => {
                                  const menuItem = menuItems.find(m => m.id === item.menuItemId);
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell>{menuItem?.name || 'Unknown Item'}</TableCell>
                                      <TableCell className="text-center">{item.quantity}</TableCell>
                                      <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                                      <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow>
                                  <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                                  <TableCell className="text-right font-bold">{formatPrice(order.totalAmount)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </TableComponent>
                          ) : (
                            <div className="text-center py-4">Loading order items...</div>
                          )}
                          
                          <div className="flex justify-end space-x-2">
                            {order.status !== "completed" && (
                              <Button
                                onClick={() => {
                                  const nextStatus = {
                                    pending: "preparing",
                                    preparing: "served",
                                    served: "completed",
                                  }[order.status];
                                  if (nextStatus) {
                                    updateOrderStatusMutation.mutate({
                                      id: order.id,
                                      status: nextStatus,
                                    });
                                  }
                                }}
                              >
                                Mark as {
                                  order.status === "pending" ? "Preparing" :
                                  order.status === "preparing" ? "Served" :
                                  "Completed"
                                }
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {order.status !== "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const nextStatus = {
                              pending: "preparing",
                              preparing: "served",
                              served: "completed",
                            }[order.status];
                            if (nextStatus) {
                              updateOrderStatusMutation.mutate({
                                id: order.id,
                                status: nextStatus,
                              });
                            }
                          }}
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Update Status
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {activeOrders.length === 0 && (
              <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg">
                <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Active Orders</h3>
                <p className="text-muted-foreground mt-1">Create a new order to get started</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <TableComponent>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedOrders.map((order) => {
                const table = tables.find((t) => t.id === order.tableId);
                const itemsCount = orderItemsCache[order.id]?.length || 0;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>Table #{table?.number || order.tableId}</TableCell>
                    <TableCell>{itemsCount} items</TableCell>
                    <TableCell className="text-right">{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">View</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Order #{order.id} Details</DialogTitle>
                            <DialogDescription>
                              Table #{table?.number} • Completed
                            </DialogDescription>
                          </DialogHeader>
                          
                          {orderItemsCache[order.id] ? (
                            <TableComponent>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-center">Qty</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {orderItemsCache[order.id].map((item) => {
                                  const menuItem = menuItems.find(m => m.id === item.menuItemId);
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell>{menuItem?.name || 'Unknown Item'}</TableCell>
                                      <TableCell className="text-center">{item.quantity}</TableCell>
                                      <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                                      <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                  );
                                })}
                                <TableRow>
                                  <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                                  <TableCell className="text-right font-bold">{formatPrice(order.totalAmount)}</TableCell>
                                </TableRow>
                              </TableBody>
                            </TableComponent>
                          ) : (
                            <div className="text-center py-4">Loading order items...</div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {completedOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No completed orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </TableComponent>
        </TabsContent>
      </Tabs>
    </div>
  );
}