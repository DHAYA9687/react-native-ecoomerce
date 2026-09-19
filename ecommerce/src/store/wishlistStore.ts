import { create } from 'zustand';
import { api } from '../api/api';
import { Product } from './productStore';

export type WishlistItem = {
    id: number;
    product: Product;
};

type WishlistStore = {
    items: WishlistItem[];
    isLoading: boolean;
    error: string | null;

    fetchWishlist: (userId: number) => Promise<void>;
    addToWishlist: (userId: number, productId: number) => Promise<void>;
    removeFromWishlist: (userId: number, productId: number) => Promise<void>;
    isInWishlist: (productId: number) => boolean;
    clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistStore>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    fetchWishlist: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/wishlist', { params: { userId } });
            set({ items: response.data ?? [] });
        } catch (err: any) {
            // The backend throws (non-2xx) when the wishlist is empty instead of
            // returning an empty array, so any failure here just means "nothing
            // saved yet" - matches cartStore's tolerant treatment of its 404.
            set({ items: [] });
        } finally {
            set({ isLoading: false });
        }
    },

    addToWishlist: async (userId, productId) => {
        set({ error: null });
        try {
            // The endpoint only returns a confirmation string, not the created
            // item/product, so refetch to get the product details back.
            await api.post(`/api/wishlist/${productId}`, null, { params: { userId } });
            await get().fetchWishlist(userId);
        } catch (err) {
            console.error('Add to wishlist error:', err);
            set({ error: 'Failed to add item to wishlist' });
            throw err;
        }
    },

    removeFromWishlist: async (userId, productId) => {
        set({ error: null });
        const previous = get().items;
        set({ items: previous.filter((item) => item.product.id !== productId) });
        try {
            await api.post(`/api/wishlist/remove/${productId}`, null, { params: { userId } });
        } catch (err) {
            console.error('Remove from wishlist error:', err);
            set({ items: previous, error: 'Failed to remove item from wishlist' });
            throw err;
        }
    },

    isInWishlist: (productId) => get().items.some((item) => item.product.id === productId),

    clearWishlist: () => set({ items: [], error: null }),
}));
