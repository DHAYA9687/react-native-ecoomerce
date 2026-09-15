// src/components/ConfirmDialog.tsx
//
// App-themed confirmation dialog, meant as a drop-in replacement for
// `Alert.alert(...)` wherever the extra design control (or an in-flight
// loading state on the confirm button) is worth it.
//
// Usage:
//   const [visible, setVisible] = useState(false);
//   <ConfirmDialog
//     visible={visible}
//     title="Remove item?"
//     message={`Remove "${item.productName}" from your cart?`}
//     destructive
//     loading={isRemoving}
//     onConfirm={handleConfirm}
//     onCancel={() => setVisible(false)}
//   />
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tints the icon + confirm button red instead of the default dark theme. */
  destructive?: boolean;
  /** Icon shown in the badge above the title. Defaults based on `destructive`. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Disables both buttons and shows a spinner on the confirm button. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const accentColor = destructive ? '#EF4444' : '#111827';
  const iconName = icon ?? (destructive ? 'trash-outline' : 'help-circle-outline');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={loading ? undefined : onCancel}>
        <View style={styles.backdrop}>
          {/* Swallow taps on the card itself so they don't bubble to the backdrop */}
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: destructive ? '#FEE2E2' : '#F3F4F6' },
                ]}
              >
                <Ionicons name={iconName} size={24} color={accentColor} />
              </View>

              <Text style={styles.title}>{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: accentColor },
                    loading && styles.confirmButtonDisabled,
                  ]}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#111827',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
