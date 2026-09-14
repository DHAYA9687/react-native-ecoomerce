// src/screens/AddProductScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';

type FormErrors = {
  name?: string;
  price?: string;
  stockQuantity?: string;
};

export default function AddProductScreen() {
  const navigation = useNavigation<any>();

  const categories = useProductStore((state) => state.categories);
  const fetchCategories = useProductStore((state) => state.fetchCategories);
  const createProduct = useProductStore((state) => state.createProduct);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories().catch((err) => console.error('Fetch categories error:', err));
  }, [fetchCategories]);

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
      newErrors.price = 'Enter a valid price';
    }

    if (!stockQuantity.trim()) {
      newErrors.stockQuantity = 'Stock quantity is required';
    } else if (!Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      newErrors.stockQuantity = 'Enter a valid quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        categoryId: categoryId ?? undefined,
        brand: brand.trim() || undefined,
        sku: sku.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      // console.log('Response from Create Product:', res);
      navigation.goBack();
    } catch (err: any) {
      // console.error('Create product error:', err?.response?.data ?? err?.message ?? err);
      setErrors({ name: 'Could not create product. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.title}>Add Product</Text>
          <Text style={styles.subtitle}>Fill in the details to list a new product</Text>

          {/* Name field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name</Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputWrapperError]}>
              <Ionicons name="pricetag-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Wireless Headphones"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError('name');
                }}
                style={styles.input}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                placeholder="Short product description"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Price + Stock row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.rowItem]}>
              <Text style={styles.label}>Price</Text>
              <View style={[styles.inputWrapper, errors.price && styles.inputWrapperError]}>
                <Ionicons name="cash-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={price}
                  onChangeText={(text) => {
                    setPrice(text);
                    clearError('price');
                  }}
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
              </View>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.rowItem]}>
              <Text style={styles.label}>Stock Qty</Text>
              <View style={[styles.inputWrapper, errors.stockQuantity && styles.inputWrapperError]}>
                <Ionicons name="cube-outline" size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={stockQuantity}
                  onChangeText={(text) => {
                    setStockQuantity(text);
                    clearError('stockQuantity');
                  }}
                  style={styles.input}
                  keyboardType="number-pad"
                />
              </View>
              {errors.stockQuantity && <Text style={styles.errorText}>{errors.stockQuantity}</Text>}
            </View>
          </View>

          {/* Brand field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Optional"
                placeholderTextColor="#9CA3AF"
                value={brand}
                onChangeText={setBrand}
                style={styles.input}
              />
            </View>
          </View>

          {/* SKU field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="barcode-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Optional"
                placeholderTextColor="#9CA3AF"
                value={sku}
                onChangeText={setSku}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Image URL field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="image-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                value={imageUrl}
                onChangeText={setImageUrl}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>

          {/* Category picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {categories.length === 0 ? (
                <Text style={styles.noCategoriesText}>No categories yet</Text>
              ) : (
                categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      categoryId === cat.id && styles.categoryPillActive,
                    ]}
                    onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        categoryId === cat.id && styles.categoryTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Product</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textAreaWrapper: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryPill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  noCategoriesText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  submitBtn: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
