import { create } from 'zustand';
import { api } from '../api/api';

export type Category = {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
    active?: boolean;
};

export type CreateProductInput = {
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    categoryId?: number;
    brand?: string;
    sku?: string;
    imageUrl?: string;
};

export type Product = {
    id: number;
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    category?: Category | null;
    brand?: string;
    sku?: string;
    imageUrl?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
};

type ProductStore = {
    categories: Category[];
    isLoadingCategories: boolean;
    products: Product[];
    isLoadingProducts: boolean;
    fetchCategories: () => Promise<void>;
    createProduct: (input: CreateProductInput) => Promise<any>;
    fetchProduct: () => Promise<void>;
};

export const useProductStore = create<ProductStore>((set) => ({
    categories: [],
    isLoadingCategories: false,
    products: [],
    isLoadingProducts: false,

    fetchCategories: async () => {
        set({ isLoadingCategories: true });
        try {
            const response = await api.get('/api/categories');
            set({ categories: response.data });
        } finally {
            set({ isLoadingCategories: false });
        }
    },

    createProduct: async (input) => {
        const response = await api.post('/api/products', input);
        return response.data;
    },

    fetchProduct: async () => {
        set({ isLoadingProducts: true });
        try {
            const response = await api.get("/api/products");
            // console.log("response from prodcuts", response.data)
            set({ products: response.data })
        } finally {
            set({ isLoadingProducts: false })
        }
    }
}));
