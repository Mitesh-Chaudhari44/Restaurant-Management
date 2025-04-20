import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type Customer, type Order, type OrderItem, type CustomerVisit, type MenuItem, type Table } from "@shared/schema";
import { CustomerForm } from "@/components/customers/customer-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, History, User, Mail, Phone, Calendar, Utensils, Home, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerWithHistory extends Customer {
  visits?: CustomerVisit[];
  orders?: Order[];
}

export default function Customers() {
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: tables, isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  const { data: menuItems, isLoading: menuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
  });

  // Get customer visits and orders when a customer is selected
  const { data: customerDetails, isLoading: customerDetailsLoading } = useQuery<CustomerWithHistory>({
    queryKey: ["/api/customers", selectedCustomer, "details"],
    queryFn: async () => {
      if (!selectedCustomer) return null;

      const customer = customers?.find(c => c.id === selectedCustomer);
      if (!customer) return null;

      // Get customer visits
      const visitsResponse = await fetch(`/api/customers/${selectedCustomer}/visits`);
      const visits = await visitsResponse.json();

      // Get customer orders
      const ordersResponse = await fetch(`/api/customers/${selectedCustomer}/orders`);
      const orders = await ordersResponse.json();

      return {
        ...customer,
        visits,
        orders,
      };
    },
    enabled: !!selectedCustomer,
  });

  // Get order items for a specific order
  const getOrderItems = async (orderId: number): Promise<OrderItem[]> => {
    const response = await fetch(`/api/orders/${orderId}`);
    const data = await response.json();
    return data.items || [];
  };

  const createCustomerMutation = useMutation({
    mutationFn: async (data: Omit<Customer, "id" | "createdAt">) => {
      await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer created",
        description: "New customer has been added successfully.",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number | undefined) => {
      if (customerId === undefined) return;
      await apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomer(null);
      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error deleting customer",
        description: err.message,
        variant: "destructive",
      });
    }
  });


  const isLoading = customersLoading || tablesLoading || menuItemsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Customers</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              onSubmit={async (data) => {
                await createCustomerMutation.mutateAsync(data);
              }}
              tables={tables || []}
              enableTableAssignment={true}
            />
          </DialogContent>
        </Dialog>
      </div>

      {selectedCustomer ? (
        <div className="space-y-6">
          <div className="flex items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCustomer(null)}
              >
                Back to All Customers
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteCustomerMutation.mutate(selectedCustomer)}
              >
                Delete Customer
              </Button>
            </div>
            <h2 className="text-2xl font-semibold">
              {customerDetailsLoading 
                ? <Skeleton className="h-8 w-40" /> 
                : customerDetails?.name
              }
            </h2>
          </div>

          {customerDetailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">
                  <Info className="h-4 w-4 mr-2" />
                  Customer Info
                </TabsTrigger>
                <TabsTrigger value="visits">
                  <Home className="h-4 w-4 mr-2" />
                  Table Visits
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <Utensils className="h-4 w-4 mr-2" />
                  Order History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="h-4 w-4 mr-2" />
                          Name
                        </div>
                        <div className="font-medium">{customerDetails?.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </div>
                        <div className="font-medium">{customerDetails?.email}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2" />
                          Phone
                        </div>
                        <div className="font-medium">{customerDetails?.phone}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          Customer Since
                        </div>
                        <div className="font-medium">
                          {new Date(customerDetails?.createdAt || "").toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Table Assignment Section */}
                    <div className="mt-6 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Assign to Table</h3>

                      {customerDetails?.visits && 
                       customerDetails.visits.some(visit => !visit.endTime) ? (
                        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
                          <p>This customer is currently assigned to a table. Complete the visit before assigning to a new table.</p>
                        </div>
                      ) : (
                        tables && tables.filter(table => !table.occupied).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {tables.filter(table => !table.occupied).map(table => (
                              <div 
                                key={table.id}
                                className="border rounded-md p-3 hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all"
                                onClick={async () => {
                                  try {
                                    // Create a new customer visit
                                    await apiRequest("POST", `/api/customers/${selectedCustomer}/visits`, {
                                      tableId: table.id,
                                      startTime: new Date(),
                                    });

                                    // Update table status to occupied
                                    await apiRequest("PATCH", `/api/tables/${table.id}`, {
                                      occupied: true
                                    });

                                    // Refresh data
                                    queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer, "details"] });
                                    queryClient.invalidateQueries({ queryKey: ["/api/tables"] });

                                    toast({
                                      title: "Table Assigned",
                                      description: `Customer assigned to Table #${table.number}`,
                                    });
                                  } catch (error) {
                                    console.error('Error assigning table:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to assign table",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <div className="font-medium">Table #{table.number}</div>
                                <div className="text-sm text-muted-foreground">Capacity: {table.capacity}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-md text-gray-800">
                            <p>No tables available for assignment. All tables are currently occupied.</p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visits">
                <Card>
                  <CardHeader>
                    <CardTitle>Table Visit History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerDetails?.visits && customerDetails.visits.length > 0 ? (
                      <TableComponent>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Table</TableHead>
                            <TableHead>Visit Date</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerDetails.visits.map((visit) => {
                            const table = tables?.find(t => t.id === visit.tableId);
                            const startTime = new Date(visit.startTime);
                            const endTime = visit.endTime ? new Date(visit.endTime) : null;

                            let duration = "In progress";
                            if (endTime) {
                              const durationMs = endTime.getTime() - startTime.getTime();
                              const durationMins = Math.floor(durationMs / (1000 * 60));
                              duration = durationMins <= 59 
                                ? `${durationMins} min` 
                                : `${Math.floor(durationMins / 60)} hr ${durationMins % 60} min`;
                            }

                            return (
                              <TableRow key={visit.id}>
                                <TableCell>Table #{table?.number || visit.tableId}</TableCell>
                                <TableCell>
                                  {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </TableCell>
                                <TableCell>
                                  {endTime ? duration : <Badge>In progress</Badge>}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </TableComponent>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No table visits recorded for this customer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerDetails?.orders && customerDetails.orders.length > 0 ? (
                      <TableComponent>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerDetails.orders.map((order) => {
                            const table = tables?.find(t => t.id === order.tableId);
                            const orderDate = new Date(order.createdAt);

                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id}</TableCell>
                                <TableCell>
                                  {orderDate.toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  Table #{table?.number || order.tableId}
                                </TableCell>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="link" className="p-0 h-auto">
                                        View Items
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Order #{order.id} Items</DialogTitle>
                                      </DialogHeader>
                                      <TableComponent>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {/* Render placeholder rows until we implement a proper order items fetching mechanism */}
                                          <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4">
                                              Loading order items...
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </TableComponent>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    className={
                                      order.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                                      order.status === "served" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : 
                                      "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  ₹{(order.totalAmount).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </TableComponent>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No orders found for this customer.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers?.map((customer) => (
            <Card key={customer.id} className="cursor-pointer hover:border-primary/50 transition-all duration-200" 
              onClick={() => setSelectedCustomer(customer.id)}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{customer.name}</CardTitle>
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Since {new Date(customer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}