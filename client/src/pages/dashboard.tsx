import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Order, type MenuItem, type Table, type Customer } from "@shared/schema";
import { CircleDollarSign, Utensils, TableIcon, History, Users, ChefHat } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: orders } = useQuery<Order[]>({ 
    queryKey: ["/api/orders"]
  });
  
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"]
  });

  const { data: tables } = useQuery<Table[]>({
    queryKey: ["/api/tables"]
  });
  
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"]
  });

  const totalSales = orders?.reduce((sum, order) => sum + Number(order.totalAmount), 0) || 0;
  const activeOrders = orders?.filter(o => o.status !== "completed").length || 0;
  const availableTables = tables?.filter(t => !t.occupied).length || 0;
  const popularItems = menuItems?.slice(0, 5) || [];
  
  // Format price as currency
  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">Dashboard</h1>
        <div className="flex space-x-2">
          <span className="text-sm text-muted-foreground">Today: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-amber-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 p-2">
            <CircleDollarSign className="h-8 w-8 text-amber-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Total Sales</CardTitle>
            <CardDescription>All time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalSales)}</div>
            <div className="mt-4 h-1 w-full bg-amber-100 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-1 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-orange-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 p-2">
            <History className="h-8 w-8 text-orange-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Active Orders</CardTitle>
            <CardDescription>Orders in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <div className="mt-4 h-1 w-full bg-orange-100 rounded-full overflow-hidden">
              <div className="bg-orange-400 h-1 rounded-full" style={{ width: `${Math.min(activeOrders * 10, 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 p-2">
            <TableIcon className="h-8 w-8 text-emerald-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Available Tables</CardTitle>
            <CardDescription>Ready for seating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTables} / {tables?.length || 0}</div>
            <div className="mt-4 h-1 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${(availableTables / (tables?.length || 1)) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 p-2">
            <Utensils className="h-8 w-8 text-blue-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Menu Items</CardTitle>
            <CardDescription>Available dishes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems?.length || 0}</div>
            <div className="mt-4 h-1 w-full bg-blue-100 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-1 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-amber-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link href="/orders">
              <a className="text-sm text-amber-600 hover:text-amber-800">View all</a>
            </Link>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => {
                  const table = tables?.find(t => t.id === order.tableId);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center space-x-4">
                        <div className="bg-amber-100 rounded-full p-2">
                          <img src="./images/food-2.svg" alt="Order" className="h-8 w-8" />
                        </div>
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-sm text-muted-foreground">Table #{table?.number || order.tableId}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">{formatPrice(order.totalAmount)}</div>
                          <div className="text-xs capitalize px-2 py-1 rounded-full text-white font-medium"
                               style={{ 
                                 backgroundColor: order.status === 'pending' ? '#f59e0b' : 
                                                  order.status === 'preparing' ? '#3b82f6' : 
                                                  order.status === 'served' ? '#10b981' : '#6b7280'
                               }}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <img src="./images/food-3.svg" alt="No orders" className="h-24 w-24 mb-4 opacity-50" />
                <p className="text-muted-foreground">No recent orders found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-orange-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Popular Menu Items</CardTitle>
              <CardDescription>Best selling dishes</CardDescription>
            </div>
            <Link href="/menu">
              <a className="text-sm text-orange-600 hover:text-orange-800">View all</a>
            </Link>
          </CardHeader>
          <CardContent>
            {popularItems.length > 0 ? (
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <img src={`./images/food-${(index % 3) + 1}.svg`} alt={item.name} className="h-8 w-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.description?.substring(0, 25)}...</p>
                    </div>
                    <div className="font-medium">{formatPrice(item.price)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <img src="/images/food-1.svg" alt="No menu items" className="h-24 w-24 mb-4 opacity-50" />
                <p className="text-muted-foreground">No menu items found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-emerald-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Table Status</CardTitle>
              <CardDescription>Current table occupation</CardDescription>
            </div>
            <Link href="/tables">
              <a className="text-sm text-emerald-600 hover:text-emerald-800">Manage tables</a>
            </Link>
          </CardHeader>
          <CardContent>
            {tables && tables.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tables.map(table => (
                  <div key={table.id} 
                       className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center h-24
                                  ${table.occupied 
                                    ? 'bg-red-50 border-red-200' 
                                    : 'bg-emerald-50 border-emerald-200'}`}>
                    <img src="./images/table.svg" alt="Table" className="h-8 w-8 mb-2" />
                    <div className="font-medium">Table #{table.number}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full mt-1 font-medium 
                                   ${table.occupied 
                                     ? 'bg-red-100 text-red-800' 
                                     : 'bg-emerald-100 text-emerald-800'}`}>
                      {table.occupied ? 'Occupied' : 'Available'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <img src="/images/table.svg" alt="No tables" className="h-24 w-24 mb-4 opacity-50" />
                <p className="text-muted-foreground">No tables found</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Customers</CardTitle>
              <CardDescription>Latest restaurant visitors</CardDescription>
            </div>
            <Link href="/customers">
              <a className="text-sm text-blue-600 hover:text-blue-800">View all</a>
            </Link>
          </CardHeader>
          <CardContent>
            {customers && customers.length > 0 ? (
              <div className="space-y-4">
                {customers.slice(0, 5).map(customer => (
                  <div key={customer.id} className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customer.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <img src="./images/customers.svg" alt="No customers" className="h-24 w-24 mb-4 opacity-50" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
