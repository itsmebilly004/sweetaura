import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Order = Tables<'orders'>;

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*`) // Select all columns for mutations
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mutation to update order status
  const approveOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: 'delivered' })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order marked as delivered!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (error) => {
      toast.error(`Failed to approve order: ${error.message}`);
    },
  });

  // Mutation to delete an order
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setOrderToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete order: ${error.message}`);
      setOrderToDelete(null);
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            A list of all the submitted orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Proof</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.customer_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn({
                          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700": order.status === 'delivered',
                          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700": order.status === 'pending',
                        })}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.created_at), "PPP")}</TableCell>
                    <TableCell className="text-right">Ksh {order.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {order.payment_proof_url ? (
                        <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">View</Button>
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => approveOrderMutation.mutate(order.id)}
                            disabled={order.status === 'delivered'}
                          >
                            Mark as Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setOrderToDelete(order)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(isOpen) => !isOpen && setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order from
              "{orderToDelete?.customer_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (orderToDelete) {
                  deleteOrderMutation.mutate(orderToDelete.id);
                }
              }}
              disabled={deleteOrderMutation.isLoading}
            >
              {deleteOrderMutation.isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminOrders;