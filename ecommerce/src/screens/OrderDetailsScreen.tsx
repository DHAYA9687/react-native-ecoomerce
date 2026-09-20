// src/screens/OrderDetailsScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useAddressStore } from '../store/addressStore';
import { Order, useOrderStore } from '../store/orderStore';
import { formatPrice } from '../utils/currency';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: '#D97706', bg: '#FEF3C7' },
  CONFIRMED: { label: 'Confirmed', color: '#D97706', bg: '#FEF3C7' },
  SHIPPED: { label: 'Shipped', color: '#2563EB', bg: '#DBEAFE' },
  DELIVERED: { label: 'Delivered', color: '#059669', bg: '#D1FAE5' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
};

// The backend only exposes the order's current status, not a timestamped
// history, so the timeline below just marks how far along this pipeline the
// order's current status places it.
const TRACKING_STEPS: { status: Order['status']; label: string }[] = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params;

  const userId = useAuthStore((state) => state.user?.id);

  const order = useOrderStore((state) => state.currentOrder);
  const isLoading = useOrderStore((state) => state.isLoading);
  const fetchOrder = useOrderStore((state) => state.fetchOrder);

  const addresses = useAddressStore((state) => state.addresses);
  const fetchAddresses = useAddressStore((state) => state.fetchAddresses);

  useEffect(() => {
    if (!userId) return;
    fetchOrder(userId, id).catch((err) => console.error('Fetch order error:', err));
    if (addresses.length === 0) {
      fetchAddresses(userId).catch((err) => console.error('Fetch addresses error:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id]);

  if (!order || order.orderId !== id) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  const config = STATUS_CONFIG[order.status];
  const address = addresses.find((a) => a.id === order.addressId);
  const currentStepIndex = TRACKING_STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order summary card */}
        <View style={styles.card}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderId}>Order #{order.orderId}</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
        </View>

        {/* Tracking timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            {TRACKING_STEPS.map((step, index) => {
              const done = index <= currentStepIndex;
              return (
                <View key={step.status} style={styles.trackRow}>
                  <View style={styles.trackIconCol}>
                    <View style={[styles.trackDot, done && styles.trackDotDone]} />
                    {index < TRACKING_STEPS.length - 1 && (
                      <View style={[styles.trackLine, done && styles.trackLineDone]} />
                    )}
                  </View>
                  <View style={styles.trackTextCol}>
                    <Text style={[styles.trackLabel, done && styles.trackLabelDone]}>
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <View style={styles.itemIconBox}>
                <Ionicons name="cube-outline" size={20} color="#6B7280" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Shipping address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          {address ? (
            <>
              <Text style={styles.addressName}>{address.fullName}</Text>
              <Text style={styles.addressLine}>{address.addressLine}</Text>
              <Text style={styles.addressLine}>
                {address.city}, {address.state} {address.postalCode}
              </Text>
              <Text style={styles.addressLine}>{address.country}</Text>
              <Text style={styles.addressLine}>{address.phone}</Text>
            </>
          ) : (
            <Text style={styles.addressLine}>Address unavailable.</Text>
          )}
        </View>

        {/* Payment + price summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>{order.paymentStatus}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  trackRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trackIconCol: {
    alignItems: 'center',
    width: 16,
  },
  trackDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  trackDotDone: {
    backgroundColor: '#111827',
  },
  trackLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  trackLineDone: {
    backgroundColor: '#111827',
  },
  trackTextCol: {
    flex: 1,
    marginBottom: 16,
  },
  trackLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  trackLabelDone: {
    color: '#111827',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  itemQty: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  addressName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
});
