// src/screens/AddressesScreen.tsx
import React, { useCallback, useState } from 'react';
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
import { Address, AddressInput, useAddressStore } from '../store/addressStore';

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

export default function AddressesScreen() {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.user?.id);

  const addresses = useAddressStore((state) => state.addresses);
  const isLoading = useAddressStore((state) => state.isLoading);
  const fetchAddresses = useAddressStore((state) => state.fetchAddresses);
  const createAddress = useAddressStore((state) => state.createAddress);
  const deleteAddress = useAddressStore((state) => state.deleteAddress);

  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressInput>(EMPTY_ADDRESS_FORM);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressInput, string>>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchAddresses(userId).catch((err) => console.error('Fetch addresses error:', err));
      }
    }, [userId, fetchAddresses])
  );

  const openAddForm = () => {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setAddressErrors({});
    setIsFormVisible(true);
  };

  const handleDelete = (address: Address) => {
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

  const handleSave = async () => {
    if (!userId) return;

    const errors: Partial<Record<keyof AddressInput, string>> = {};
    ADDRESS_FIELDS.forEach(({ key, label }) => {
      if (!addressForm[key].trim()) {
        errors[key] = `${label} is required`;
      }
    });
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      await createAddress(userId, addressForm);
      setIsFormVisible(false);
    } catch (err) {
      Alert.alert('Something went wrong', 'Could not save this address.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={openAddForm} hitSlop={8}>
          <Ionicons name="add" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {isLoading && addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtitle}>Add a delivery address to speed up checkout</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddForm}>
            <Text style={styles.addBtnText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {addresses.map((addr) => {
            const isDeleting = deletingAddressId === addr.id;
            return (
              <View key={addr.id} style={styles.card}>
                <View style={styles.cardTextCol}>
                  <Text style={styles.addressName}>{addr.fullName}</Text>
                  <Text style={styles.addressLine}>{addr.addressLine}</Text>
                  <Text style={styles.addressLine}>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </Text>
                  <Text style={styles.addressLine}>{addr.country}</Text>
                  <Text style={styles.addressLine}>{addr.phone}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(addr)}
                  disabled={isDeleting}
                  hitSlop={8}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add new address */}
      <Modal visible={isFormVisible} transparent animationType="fade">
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
                onPress={() => setIsFormVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
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
  listContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTextCol: { flex: 1, marginRight: 12 },
  addressName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  addressLine: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  addBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
