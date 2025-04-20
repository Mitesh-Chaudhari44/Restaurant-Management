import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { type Table } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTableSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export default function Tables() {
  const { toast } = useToast();

  const { data: tables, isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  })

  const createTableMutation = useMutation({
    mutationFn: async (data: Omit<Table, "id">) => {
      await apiRequest("POST", "/api/tables", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Table created",
        description: "New table has been added successfully.",
      });
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: async ({ id, occupied }: { id: number; occupied: boolean }) => {
      await apiRequest("PATCH", `/api/tables/${id}`, {
        occupied,
        arrivalTime: occupied ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({
        title: "Table deleted",
        description: "Table has been removed successfully.",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertTableSchema),
    defaultValues: {
      number: 1,
      capacity: 4,
      occupied: false,
    },
  });

  if (isLoading) {
    return <div>Loading tables...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tables</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(async (data) => {
                  await createTableMutation.mutateAsync(data);
                  form.reset();
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Table Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Create Table</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables?.map((table) => (
          <Card
            key={table.id}
            className={table.occupied ? "border-red-200" : "border-green-200"}
          >
            <CardHeader>
              <CardTitle>Table {table.number}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Capacity: {table.capacity}</span>
                </div>
                {table.occupied && table.arrivalTime && (
                  <div className="text-sm text-muted-foreground">
                    Arrived: {new Date(table.arrivalTime).toLocaleTimeString()}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      table.occupied
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {table.occupied ? "Occupied" : "Available"}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateTableStatusMutation.mutate({
                          id: table.id,
                          occupied: !table.occupied,
                        })
                      }
                    >
                      {table.occupied ? "Mark Available" : "Mark Occupied"}
                    </Button>
                    {!table.occupied && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">Assign Customer</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Customer to Table {table.number}</DialogTitle>
                          </DialogHeader>
                          <Select 
                            onValueChange={async (customerId) => {
                              try {
                                await apiRequest("POST", `/api/customers/${customerId}/visits`, {
                                  tableId: table.id,
                                  startTime: new Date(),
                                });

                                await updateTableStatusMutation.mutateAsync({
                                  id: table.id,
                                  occupied: true,
                                });

                                toast({
                                  title: "Success",
                                  description: "Customer assigned to table successfully",
                                });
                              } catch (error) {
                                toast({
                                  title: "Error",
                                  description: "Failed to assign customer to table",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers?.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}