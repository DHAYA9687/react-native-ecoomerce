import { create } from 'zustand';
import { api } from '../api/api';

export type Address = {
    id: number;
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
};

export type AddressInput = Omit<Address, 'id'>;

type AddressStore = {
    addresses: Address[];
    isLoading: boolean;
    error: string | null;

    fetchAddresses: (userId: number) => Promise<void>;
    createAddress: (userId: number, input: AddressInput) => Promise<Address>;
    deleteAddress: (userId: number, addressId: number) => Promise<void>;
    clearAddresses: () => void;
};

export const useAddressStore = create<AddressStore>((set, get) => ({
    addresses: [],
    isLoading: false,
    error: null,

    fetchAddresses: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/api/addresses', { params: { userId } });
            set({ addresses: response.data ?? [] });
        } catch (err) {
            console.error('Fetch addresses error:', err);
            set({ error: 'Failed to load addresses' });
        } finally {
            set({ isLoading: false });
        }
    },

    createAddress: async (userId, input) => {
        set({ error: null });
        try {
            const response = await api.post('/api/addresses', input, { params: { userId } });
            const created: Address = response.data;
            set((state) => ({ addresses: [...state.addresses, created] }));
            return created;
        } catch (err) {
            console.error('Create address error:', err);
            set({ error: 'Failed to save address' });
            throw err;
        }
    },

    deleteAddress: async (userId, addressId) => {
        set({ error: null });
        const previous = get().addresses;
        set({ addresses: previous.filter((a) => a.id !== addressId) });
        try {
            await api.delete(`/api/addresses/${addressId}`, { params: { userId } });
        } catch (err) {
            console.error('Delete address error:', err);
            set({ addresses: previous, error: 'Failed to delete address' });
            throw err;
        }
    },

    clearAddresses: () => set({ addresses: [], error: null }),
}));
