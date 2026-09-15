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

    // Sets the item's quantity to an absolute value (not a delta). Setting it
    // to 0 or less removes the item, matching the backend's own behavior.
    updateQuantity: (productId: number, quantity: number) => Promise<void>;
    removeItem: (productId: number) => Promise<void>;

    clearCart: () => void;
};

export const useCartStore = create<CartStore>((set, get) => ({
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

    updateQuantity: async (productId, quantity) => {
        const { cartId } = get();
        if (!cartId) return;

        set({ isLoading: true, error: null });
        try {
            const response = await api.put(`/api/cart/items/${cartId}`, { productId, quantity });
            if (!response.data?.success) {
                throw new Error(response.data?.message ?? 'Failed to update item');
            }
            set((state) => ({
                items:
                    quantity <= 0
                        ? state.items.filter((item) => item.productId !== productId)
                        : state.items.map((item) =>
                              item.productId === productId ? { ...item, quantity } : item
                          ),
            }));
        } catch (err) {
            console.error('Update cart item error:', err);
            set({ error: 'Failed to update item' });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    removeItem: async (productId) => {
        const { cartId } = get();
        if (!cartId) return;

        set({ isLoading: true, error: null });
        try {
            const response = await api.delete(`/api/cart/${cartId}/items/${productId}`);
            if (!response.data?.success) {
                throw new Error(response.data?.message ?? 'Failed to remove item');
            }
            set((state) => ({
                items: state.items.filter((item) => item.productId !== productId),
            }));
        } catch (err) {
            console.error('Remove cart item error:', err);
            set({ error: 'Failed to remove item' });
            throw err;
        } finally {
            set({ isLoading: false });
        }
    },

    clearCart: () => set({ cartId: null, items: [] }),
}));
