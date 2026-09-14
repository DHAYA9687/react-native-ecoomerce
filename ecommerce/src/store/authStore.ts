import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from "../api/api";
import { useCartStore } from "./cartStore";

type User = {
    id: number;
    email: string;
    username?: string;
};

type AuthStore = {
    user: User | null;
    isSignedIn: boolean;
    register: (
        username: string,
        email: string,
        password: string
    ) => Promise<any>;

    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => void;
};



export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            isSignedIn: false,

            signIn: async (email, password) => {

                // Later:
                const response = await api.post("/api/auth/login", {
                    email,
                    password
                });

                console.log("Response after login:",response)

                // await new Promise((resolve) =>
                //     setTimeout(resolve, 1200)
                // );

                set({
                    user: {
                        id: response.data.userId,
                        email: response.data.email ?? email,
                        username: response.data.username,
                    },
                    isSignedIn: true,
                });

                return response.data;
            },


             register: async (username, email, password) => {
                const response = await api.post("/api/auth/register", {
                    username,
                    email,
                    password,
                });

                console.log(response.data);

                // Usually registration doesn't automatically sign the user in.
                // So we don't change isSignedIn here.
                return response.data;
            },

            signOut: () => {
                set({
                    user: null,
                    isSignedIn: false,
                });
                // Cart data is per-user - drop it so the next sign-in on this
                // device doesn't briefly show the previous user's cart.
                useCartStore.getState().clearCart();
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist plain state - the action functions are recreated on
            // every load anyway and don't need (can't) be serialized.
            partialize: (state) => ({ user: state.user, isSignedIn: state.isSignedIn }),
            // v1 added `user.id` (needed for user-scoped calls like the cart
            // endpoints). Older persisted sessions only have `{ email }`, which
            // would silently break anything that depends on it - force those
            // back to the login screen instead of hanging around signed in.
            version: 1,
            migrate: (persistedState) => {
                const state = persistedState as Partial<AuthStore> | undefined;
                if (!state?.user || typeof state.user.id !== 'number') {
                    return { user: null, isSignedIn: false };
                }
                return state;
            },
        }
    )
);