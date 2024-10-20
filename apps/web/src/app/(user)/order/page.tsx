'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import { api } from '@/config/axios.config';
import { useSession } from 'next-auth/react';

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type Order = {
  id: number;
  invoice: string;
  total_price: number;
  status:
    | 'pending_payment'
    | 'awaiting_confirmation'
    | 'processing'
    | 'shipped'
    | 'confirmed'
    | 'cancelled';
  created_at: string;
  items: OrderItem[];
  shipping_address: string;
  payment_method: string;
};

export default function EnhancedCustomerOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>(
    'all',
  );
  const session = useSession();
  const ordersPerPage = 5;

  // Fetch orders from API on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // const response = await api.get('/order/get'); // Update with your actual API endpoint
        const response = await api.get(`/order/get`, {
          headers: {
            Authorization: 'Bearer ' + session?.data?.user.access_token,
          },
        });
        const res = response.data.data.map((order: any) => ({
          id: order.id,
          invoice: order.invoice,
          total_price: order.total_price,
          status: order.status,
          created_at: order.created_at,
          items: order.OrderItem.map((item: any) => ({
            id: item.id,
            product_name: item.Product.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
          shipping_address:
            order.Address.street +
            ', ' +
            order.Address.City.city +
            ', ' +
            order.Address.City.Province.name, // Replace with actual shipping address if available
          payment_method: order.paymentId === 1 ? 'Gateway' : 'Bank Transfer', // Example
        }));
        setOrders(res);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [session]);

  const filteredOrders = orders.filter(
    (order) =>
      (statusFilter === 'all' || order.status === statusFilter) &&
      (order.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) =>
          item.product_name.toLowerCase().includes(searchTerm.toLowerCase()),
        )),
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder,
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const statusColors: Record<Order['status'], string> = {
    pending_payment: 'bg-yellow-500',
    awaiting_confirmation: 'bg-blue-500',
    processing: 'bg-purple-500',
    shipped: 'bg-indigo-500',
    confirmed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  useEffect(() => {
    const snapScript: string = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey: any = 'SB-Mid-client-c7SnHqsRuZTiamhl';

    const script = document.createElement('script');
    script.src = snapScript;

    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (orderId: string, totalAmount: number) => {
    // const subTotal = calculateSubTotal(carts); // Menghitung subtotal dari carts
    // const totalAmount =
    //   subTotal +
    //   (selectedShippingCost || 0) -
    //   calculateVoucherDiscount(voucher, subTotal); // Total setelah diskon dan shipping cost
    // console.log(totalAmount, 'ini total amount');

    try {
      const response = await axios.post('/api/payment', {
        order_id: orderId, // Mengirim carts ke backend
        shippingCost: totalAmount || 0, // Mengirim biaya pengiriman
      });

      console.log(response, 'ini response');
      console.log(window.snap.pay(response.data.token));
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">My Orders</CardTitle>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Search className="w-5 h-5 text-gray-500" />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as Order['status'] | 'all')
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="awaiting_confirmation">
                Awaiting Confirmation
              </SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {currentOrders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking
              for.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {currentOrders.map((order, index) => (
              <AccordionItem value={`item-${index}`} key={order.id}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium">Order #{order.invoice}</span>
                    <Badge
                      className={`${statusColors[order.status]} text-white`}
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Date:</span>
                      <span>
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.product_name} (x{item.quantity})
                          </span>
                          <span>
                            {item.subtotal.toLocaleString('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>
                        {order.total_price.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                        })}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>
                        <strong>Shipping Address:</strong>{' '}
                        {order.shipping_address}
                      </p>
                      <p>
                        <strong>Payment Method:</strong> {order.payment_method}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">View Details</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                          <DialogDescription>
                            Complete information for Order #{order.invoice}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">
                              Status
                            </Label>
                            <div className="col-span-3">
                              <Badge
                                className={`${statusColors[order.status]} text-white`}
                              >
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                              Date
                            </Label>
                            <Input
                              id="date"
                              value={new Date(
                                order.created_at,
                              ).toLocaleDateString()}
                              className="col-span-3"
                              readOnly
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="total" className="text-right">
                              Total
                            </Label>
                            <Input
                              id="total"
                              value={order.total_price.toLocaleString('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                              })}
                              className="col-span-3"
                              readOnly
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      className="ml-3"
                      variant="outline"
                      onClick={() =>
                        handlePayment(order.invoice, order.total_price)
                      }
                    >
                      Pay Now
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({
            length: Math.ceil(filteredOrders.length / ordersPerPage),
          }).map((_, index) => (
            <Button
              key={index + 1}
              variant={currentPage === index + 1 ? 'default' : 'outline'}
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
