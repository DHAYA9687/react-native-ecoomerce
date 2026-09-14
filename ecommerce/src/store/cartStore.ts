import { create } from 'zustand';
import { api } from '../api/api';

export type CartItem = {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
};

type CartStore = {
    cartId: number | null;
    items: CartItem[];
    isLoading: boolean;
    error: string | null;

    fetchCart: (userId: number) => Promise<void>;
    addToCart: (userId: number, productId: number, quantity?: number) => Promise<void>;

    // NOTE: the backend doesn't expose update-quantity or remove-item
    // endpoints yet, so these only affect local state - they will not
    // survive a re-fetch of the cart until that support is added.
    updateLocalQuantity: (productId: number, delta: number) => void;
    removeLocalItem: (productId: number) => void;

    clearCart: () => void;
};

export const useCartStore = create<CartStore>((set) => ({
    cartId: null,
    items: [],
    isLoading: false,
    error: null,

    fetchCart: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/api/cart/user/${userId}`);
            set({ cartId: response.data.cartId, items: response.data.items ?? [] });
        } catch (err: any) {
            // A user who hasn't added anything yet has no cart row at all -
            // the backend returns 404 for that case, which just means "empty".
            if (err?.response?.status === 404) {
                set({ cartId: null, items: [] });
            } else {
                console.error('Fetch cart error:', err);
                set({ error: 'Failed to load cart' });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    addToCart: async (userId, productId, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/api/cart/add', { userId, productId, quantity });
            set({ cartId: response.data.cartId, items: response.data.items ?? [] });
        } catch (err) {
            console.error('Add to cart error:', err);
            set({ error: 'Failed to add item to cart' });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    updateLocalQuantity: (productId, delta) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            ),
        }));
    },

    removeLocalItem: (productId) => {
        set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
        }));
    },

    clearCart: () => set({ cartId: null, items: [] }),
}));
