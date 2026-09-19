// src/screens/CartScreen.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { CartItem, useCartStore } from '../store/cartStore';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatPrice } from '../utils/currency';

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400?text=No+Image';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.user?.id);

  const items = useCartStore((state) => state.items);
  const isLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Tracks which single item has a mutation in flight *and* which action
  // it is, so quantity changes and removal don't visually stomp on each
  // other (e.g. the trash icon shouldn't spin just because +/- was tapped).
  const [pendingAction, setPendingAction] = useState<
    { productId: number; type: 'quantity' | 'remove' } | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchCart(userId).catch((err) => console.error('Fetch cart error:', err));
      }
    }, [userId, fetchCart])
  );

  const handleQuantityChange = async (item: CartItem, delta: number) => {
    setPendingAction({ productId: item.productId, type: 'quantity' });
    try {
      await updateQuantity(item.productId, item.quantity + delta);
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not update this item’s quantity.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemove = async (item: CartItem) => {
    setPendingAction({ productId: item.productId, type: 'remove' });
    try {
      await removeItem(item.productId);
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not remove this item.');
    } finally {
      setPendingAction(null);
    }
  };

  // Any path that would take an item out of the cart - the trash icon, or
  // decreasing a quantity of 1 - goes through this confirmation dialog first.
  const [confirmTarget, setConfirmTarget] = useState<
    { item: CartItem; type: 'trash' | 'decrease' } | null
  >(null);

  const handleTrashPress = (item: CartItem) => {
    setConfirmTarget({ item, type: 'trash' });
  };

  const handleDecreasePress = (item: CartItem) => {
    if (item.quantity <= 1) {
      // Backend treats quantity <= 0 as a removal, so this is really a delete.
      setConfirmTarget({ item, type: 'decrease' });
    } else {
      handleQuantityChange(item, -1);
    }
  };

  const handleConfirmRemoval = async () => {
    if (!confirmTarget) return;
    const { item, type } = confirmTarget;
    if (type === 'trash') {
      await handleRemove(item);
    } else {
      await handleQuantityChange(item, -1);
    }
    setConfirmTarget(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 5.0 : 0;
  const total = subtotal + shipping;

  const renderItem = ({ item }: { item: CartItem }) => {
    const isPending = pendingAction?.productId === item.productId;
    const isRemoving = isPending && pendingAction?.type === 'remove';

    return (
      <View style={styles.cartCard}>
        <Image
          source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }}
          style={styles.itemImage}
          contentFit="cover"
          transition={200}
        />

        <View style={styles.itemInfo}>
          <View style={styles.itemTopRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.productName}
            </Text>
            <TouchableOpacity
              onPress={() => handleTrashPress(item)}
              disabled={isPending}
              hitSlop={8}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.itemBottomRow}>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>

            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleDecreasePress(item)}
                disabled={isPending}
              >
                <Ionicons name="remove" size={16} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleQuantityChange(item, 1)}
                disabled={isPending}
              >
                <Ionicons name="add" size={16} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything yet
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.productId)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{formatPrice(shipping)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <ConfirmDialog
        visible={!!confirmTarget}
        title="Remove item?"
        message={
          confirmTarget
            ? `Remove "${confirmTarget.item.productName}" from your cart?`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        loading={
          !!confirmTarget && pendingAction?.productId === confirmTarget.item.productId
        }
        onConfirm={handleConfirmRemoval}
        onCancel={() => setConfirmTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    minWidth: 16,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  shopBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
