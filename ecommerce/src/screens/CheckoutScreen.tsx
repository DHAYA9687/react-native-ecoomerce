// src/screens/CheckoutScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Address, AddressInput, useAddressStore } from '../store/addressStore';
import { formatPrice } from '../utils/currency';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type DeliveryMethod = {
  id: string;
  label: string;
  eta: string;
  price: number;
};

const DELIVERY_METHODS: DeliveryMethod[] = [
  { id: 'standard', label: 'Standard Delivery', eta: '4-6 business days', price: 100 },
  { id: 'express', label: 'Express Delivery', eta: '1-2 business days', price: 250 },
];

type PaymentMethod = {
  id: string;
  label: string;
  icon: IoniconName;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cod', label: 'Cash on Delivery', icon: 'cash-outline' },
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'upi', label: 'UPI', icon: 'phone-portrait-outline' },
];

const EMPTY_ADDRESS_FORM: AddressInput = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

const ADDRESS_FIELDS: { key: keyof AddressInput; label: string; keyboardType?: 'phone-pad' }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'phone', label: 'Phone', keyboardType: 'phone-pad' },
  { key: 'addressLine', label: 'Address Line' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
];

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.user?.id);

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const addresses = useAddressStore((state) => state.addresses);
  const isLoadingAddresses = useAddressStore((state) => state.isLoading);
  const fetchAddresses = useAddressStore((state) => state.fetchAddresses);
  const createAddress = useAddressStore((state) => state.createAddress);
  const deleteAddress = useAddressStore((state) => state.deleteAddress);

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressListVisible, setIsAddressListVisible] = useState(false);
  const [isAddAddressVisible, setIsAddAddressVisible] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  const [addressForm, setAddressForm] = useState<AddressInput>(EMPTY_ADDRESS_FORM);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressInput, string>>>(
    {}
  );
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [deliveryMethodId, setDeliveryMethodId] = useState(DELIVERY_METHODS[0].id);
  const [paymentMethodId, setPaymentMethodId] = useState(PAYMENT_METHODS[0].id);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        fetchAddresses(userId).catch((err) => console.error('Fetch addresses error:', err));
      }
    }, [userId, fetchAddresses])
  );

  // Keep a valid address selected as the list loads or changes (e.g. after a delete).
  useEffect(() => {
    if (selectedAddressId && addresses.some((a) => a.id === selectedAddressId)) return;
    setSelectedAddressId(addresses[0]?.id ?? null);
  }, [addresses, selectedAddressId]);

  const selectedAddress: Address | undefined = addresses.find(
    (a) => a.id === selectedAddressId
  );

  const deliveryMethod =
    DELIVERY_METHODS.find((m) => m.id === deliveryMethodId) ?? DELIVERY_METHODS[0];

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const total = subtotal + deliveryMethod.price;

  const openAddAddressForm = () => {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setAddressErrors({});
    setIsAddressListVisible(false);
    setIsAddAddressVisible(true);
  };

  const handleDeleteAddress = (address: Address) => {
    if (!userId) return;
    Alert.alert('Remove address?', `Remove "${address.fullName}"'s address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeletingAddressId(address.id);
          try {
            await deleteAddress(userId, address.id);
          } catch (err) {
            Alert.alert('Something went wrong', 'Could not remove this address.');
          } finally {
            setDeletingAddressId(null);
          }
        },
      },
    ]);
  };

  const handleSaveAddress = async () => {
    if (!userId) return;

    const errors: Partial<Record<keyof AddressInput, string>> = {};
    ADDRESS_FIELDS.forEach(({ key, label }) => {
      if (!addressForm[key].trim()) {
        errors[key] = `${label} is required`;
      }
    });
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingAddress(true);
    try {
      const created = await createAddress(userId, addressForm);
      setSelectedAddressId(created.id);
      setIsAddAddressVisible(false);
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not save this address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Your cart is empty', 'Add something to your cart before checking out.');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Add a delivery address', 'You need a delivery address to place this order.');
      openAddAddressForm();
      return;
    }

    setIsPlacingOrder(true);
    try {
      // No order-placement backend exists yet - simulate the round trip so
      // the flow feels real, then drop the cart like a completed order would.
      await new Promise((resolve) => setTimeout(resolve, 800));
      clearCart();
      Alert.alert('Order placed!', 'Your order has been placed successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Orders' }) },
      ]);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Delivery address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {isLoadingAddresses && addresses.length === 0 ? (
            <ActivityIndicator size="small" color="#111827" style={{ alignSelf: 'flex-start' }} />
          ) : selectedAddress ? (
            <>
              <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
              <Text style={styles.addressLine}>{selectedAddress.addressLine}</Text>
              <Text style={styles.addressLine}>
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
              </Text>
              <Text style={styles.addressLine}>{selectedAddress.country}</Text>
              <Text style={styles.addressLine}>{selectedAddress.phone}</Text>
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={() => setIsAddressListVisible(true)}
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.addressLine}>No delivery address saved yet.</Text>
              <TouchableOpacity style={styles.changeBtn} onPress={openAddAddressForm}>
                <Text style={styles.changeBtnText}>Add Address</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Delivery method */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          {DELIVERY_METHODS.map((method) => {
            const selected = method.id === deliveryMethodId;
            return (
              <TouchableOpacity
                key={method.id}
                style={styles.optionRow}
                onPress={() => setDeliveryMethodId(method.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionLabel}>{method.label}</Text>
                  <Text style={styles.optionSubtext}>{method.eta}</Text>
                </View>
                <Text style={styles.optionPrice}>{formatPrice(method.price)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => {
            const selected = method.id === paymentMethodId;
            return (
              <TouchableOpacity
                key={method.id}
                style={styles.optionRow}
                onPress={() => setPaymentMethodId(method.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Ionicons
                  name={method.icon}
                  size={18}
                  color="#4B5563"
                  style={styles.optionIcon}
                />
                <Text style={styles.optionLabel}>{method.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.productId} style={styles.summaryRow}>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {item.productName} × {item.quantity}
              </Text>
              <Text style={styles.summaryValue}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatPrice(deliveryMethod.price)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place order bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, isPlacingOrder && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>PLACE ORDER</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Saved addresses */}
      <Modal visible={isAddressListVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delivery Address</Text>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {addresses.map((addr) => {
                const selected = addr.id === selectedAddressId;
                const isDeleting = deletingAddressId === addr.id;
                return (
                  <View key={addr.id} style={styles.addressOptionRow}>
                    <TouchableOpacity
                      style={styles.addressOptionMain}
                      onPress={() => {
                        setSelectedAddressId(addr.id);
                        setIsAddressListVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <View style={styles.optionTextCol}>
                        <Text style={styles.optionLabel}>{addr.fullName}</Text>
                        <Text style={styles.optionSubtext} numberOfLines={2}>
                          {addr.addressLine}, {addr.city}, {addr.state} {addr.postalCode}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(addr)}
                      disabled={isDeleting}
                      hitSlop={8}
                      style={{ padding: 4 }}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
              {addresses.length === 0 && (
                <Text style={styles.addressLine}>No saved addresses yet.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.addAddressBtn} onPress={openAddAddressForm}>
              <Ionicons name="add" size={18} color="#4F46E5" />
              <Text style={styles.addAddressBtnText}>Add New Address</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setIsAddressListVisible(false)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add new address */}
      <Modal visible={isAddAddressVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Address</Text>

              {ADDRESS_FIELDS.map(({ key, label, keyboardType }) => (
                <View key={key}>
                  <Text style={styles.inputLabel}>
                    {label} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, addressErrors[key] && styles.inputError]}
                    value={addressForm[key]}
                    onChangeText={(text) => {
                      setAddressForm((prev) => ({ ...prev, [key]: text }));
                      setAddressErrors((prev) => ({ ...prev, [key]: undefined }));
                    }}
                    placeholder={label}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={keyboardType}
                  />
                  {addressErrors[key] && (
                    <Text style={styles.fieldErrorText}>{addressErrors[key]}</Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddAddressVisible(false)}
                disabled={isSavingAddress}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveAddress}
                disabled={isSavingAddress}
              >
                {isSavingAddress ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  addressName: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  addressLine: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  changeBtn: { alignSelf: 'flex-start', marginTop: 10 },
  changeBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addressOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  addressOptionMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: { borderColor: '#111827' },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#111827' },
  optionIcon: { marginRight: 10 },
  optionTextCol: { flex: 1 },
  optionLabel: { fontSize: 13, fontWeight: '600', color: '#111827' },
  optionSubtext: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  optionPrice: { fontSize: 13, fontWeight: '700', color: '#111827' },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  addAddressBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  summaryLabel: { flex: 1, fontSize: 13, color: '#6B7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  placeOrderBtn: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderBtnDisabled: { backgroundColor: '#9CA3AF' },
  placeOrderText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  requiredAsterisk: { color: '#EF4444' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 14,
  },
  inputError: { borderColor: '#EF4444' },
  fieldErrorText: { fontSize: 11, color: '#EF4444', marginTop: -10, marginBottom: 12 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  modalSaveBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  modalSaveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
