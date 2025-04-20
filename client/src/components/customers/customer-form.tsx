import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema } from "@shared/schema";
import type { Customer, InsertCustomer, Table } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

interface CustomerFormProps {
  onSubmit: (data: InsertCustomer) => Promise<void>;
  defaultValues?: Customer;
  tables?: Table[];
  enableTableAssignment?: boolean;
}

export function CustomerForm({ 
  onSubmit, 
  defaultValues, 
  tables = [], 
  enableTableAssignment = false 
}: CustomerFormProps) {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [assignTable, setAssignTable] = useState(false);
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
    },
  });

  const handleSubmit = async (data: InsertCustomer) => {
    try {
      // First save the customer
      await onSubmit(data);
      
      // If table assignment is checked, create a customer visit and update table
      if (assignTable && selectedTable) {
        try {
          // Get the newly created customer ID - this requires modifying the onSubmit to return the customer
          const customerId = (defaultValues?.id); // For existing customer
          
          if (customerId) {
            // Create a customer visit
            await apiRequest("POST", `/api/customers/${customerId}/visits`, {
              tableId: selectedTable,
              startTime: new Date(),
            });
            
            // Update the table status to occupied
            await apiRequest("PATCH", `/api/tables/${selectedTable}`, {
              occupied: true
            });
            
            toast({
              title: "Table Assigned",
              description: "Customer has been assigned to the selected table",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to assign table to customer",
            variant: "destructive",
          });
        }
      }
      
      form.reset();
      setSelectedTable(null);
      setAssignTable(false);
      
      toast({
        title: "Success",
        description: "Customer saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive",
      });
    }
  };

  // Get only unoccupied tables
  const availableTables = tables.filter(table => !table.occupied);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {enableTableAssignment && tables.length > 0 && (
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="assignTable" 
                checked={assignTable}
                onCheckedChange={(checked) => setAssignTable(checked as boolean)}
              />
              <label
                htmlFor="assignTable"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Assign customer to a table
              </label>
            </div>
            
            {assignTable && (
              <div>
                <FormLabel>Select Table</FormLabel>
                <Select
                  onValueChange={(value) => setSelectedTable(parseInt(value))}
                  value={selectedTable?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.length > 0 ? (
                      availableTables.map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          Table {table.number} (Capacity: {table.capacity})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-tables" disabled>
                        No available tables
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableTables.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    All tables are currently occupied
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <Button type="submit">Save Customer</Button>
      </form>
    </Form>
  );
}
