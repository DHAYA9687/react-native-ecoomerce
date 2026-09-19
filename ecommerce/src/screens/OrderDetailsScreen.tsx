// src/screens/OrderDetailsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatPrice } from '../utils/currency';

// ---- Temporary mock data (replace with TanStack Query later, fetched by id) ----
const ORDER = {
  id: 'ORD-1023',
  date: 'Aug 28, 2026',
  status: 'shipped',
  paymentMethod: 'Visa •••• 4242',
  address: {
    name: 'Dhaya S',
    line1: '12, Anna Nagar 2nd Street',
    line2: 'Ambattur, Chennai, Tamil Nadu 600053',
    phone: '+91 98765 43210',
  },
  items: [
    {
      id: '1',
      name: 'Wireless Headphones Pro',
      variant: 'Black / L',
      price: 59.99,
      quantity: 1,
      image: 'https://picsum.photos/seed/p1/200/200',
    },
  ],
  subtotal: 59.99,
  shipping: 5.0,
  total: 64.99,
  tracking: [
    { id: '1', label: 'Order Placed', time: 'Aug 28, 9:12 AM', done: true },
    { id: '2', label: 'Processing', time: 'Aug 28, 2:40 PM', done: true },
    { id: '3', label: 'Shipped', time: 'Aug 29, 8:05 AM', done: true },
    { id: '4', label: 'Out for Delivery', time: 'Pending', done: false },
    { id: '5', label: 'Delivered', time: 'Pending', done: false },
  ],
};
// --------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  processing: { label: 'Processing', color: '#D97706', bg: '#FEF3C7' },
  shipped: { label: 'Shipped', color: '#2563EB', bg: '#DBEAFE' },
  delivered: { label: 'Delivered', color: '#059669', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
};

export default function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // const { id } = route.params; // use this to fetch the real order

  const config = STATUS_CONFIG[ORDER.status];

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
            <Text style={styles.orderId}>{ORDER.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>Placed on {ORDER.date}</Text>
        </View>

        {/* Tracking timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tracking</Text>
          {ORDER.tracking.map((step, index) => (
            <View key={step.id} style={styles.trackRow}>
              <View style={styles.trackIconCol}>
                <View
                  style={[
                    styles.trackDot,
                    step.done && styles.trackDotDone,
                  ]}
                />
                {index < ORDER.tracking.length - 1 && (
                  <View
                    style={[
                      styles.trackLine,
                      step.done && styles.trackLineDone,
                    ]}
                  />
                )}
              </View>
              <View style={styles.trackTextCol}>
                <Text
                  style={[
                    styles.trackLabel,
                    step.done && styles.trackLabelDone,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.trackTime}>{step.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {ORDER.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemVariant}>{item.variant}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Shipping address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <Text style={styles.addressName}>{ORDER.address.name}</Text>
          <Text style={styles.addressLine}>{ORDER.address.line1}</Text>
          <Text style={styles.addressLine}>{ORDER.address.line2}</Text>
          <Text style={styles.addressLine}>{ORDER.address.phone}</Text>
        </View>

        {/* Payment + price summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Method</Text>
            <Text style={styles.summaryValue}>{ORDER.paymentMethod}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(ORDER.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatPrice(ORDER.shipping)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(ORDER.total)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Ionicons name="help-circle-outline" size={16} color="#111827" />
            <Text style={styles.secondaryBtnText}>Get Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.primaryBtnText}>Reorder</Text>
          </TouchableOpacity>
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
  trackTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  itemVariant: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});