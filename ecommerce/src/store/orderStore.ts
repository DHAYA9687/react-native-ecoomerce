import { create } from 'zustand';
import { api } from '../api/api';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type OrderItem = {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
};

export type Order = {
    orderId: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    totalAmount: number;
    addressId: number;
    createdAt: string;
    items: OrderItem[];
};

export type PlaceOrderInput = {
    addressId: number;
    paymentMethod: string;
    deliveryMethod: string;
};

type OrderStore = {
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;
    error: string | null;

    fetchOrders: (userId: number) => Promise<void>;
    fetchOrder: (userId: number, orderId: number) => Promise<void>;
    placeOrder: (userId: number, input: PlaceOrderInput) => Promise<Order>;
    clearOrders: () => void;
};

export const useOrderStore = create<OrderStore>((set, get) => ({
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,

    fetchOrders: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/orders', { params: { userId } });
            set({ orders: response.data ?? [] });
        } catch (err) {
            console.error('Fetch orders error:', err);
            set({ error: 'Failed to load orders' });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchOrder: async (userId, orderId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/api/orders/${orderId}`, { params: { userId } });
            set({ currentOrder: response.data });
        } catch (err) {
            console.error('Fetch order error:', err);
            set({ error: 'Failed to load order' });
        } finally {
            set({ isLoading: false });
        }
    },

    placeOrder: async (userId, input) => {
        set({ error: null });
        try {
            const response = await api.post('/api/orders', input, { params: { userId } });
            const created: Order = response.data;
            set((state) => ({ orders: [created, ...state.orders] }));
            return created;
        } catch (err) {
            console.error('Place order error:', err);
            set({ error: 'Failed to place order' });
            throw err;
        }
    },

    clearOrders: () => set({ orders: [], currentOrder: null, error: null }),
}));
