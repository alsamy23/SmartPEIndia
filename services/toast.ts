export type ToastType = 'success' | 'error' | 'info';

export interface ToastConfig {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ConfirmConfig {
  id: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

// Custom event names
export const SHOW_TOAST_EVENT = 'smartpe_show_toast';
export const SHOW_CONFIRM_EVENT = 'smartpe_show_confirm';

export const toast = {
  success(message: string, duration = 3000) {
    const event = new CustomEvent(SHOW_TOAST_EVENT, {
      detail: { id: Math.random().toString(), message, type: 'success', duration }
    });
    window.dispatchEvent(event);
  },
  error(message: string, duration = 4000) {
    const event = new CustomEvent(SHOW_TOAST_EVENT, {
      detail: { id: Math.random().toString(), message, type: 'error', duration }
    });
    window.dispatchEvent(event);
  },
  info(message: string, duration = 3000) {
    const event = new CustomEvent(SHOW_TOAST_EVENT, {
      detail: { id: Math.random().toString(), message, type: 'info', duration }
    });
    window.dispatchEvent(event);
  },
  confirm(message: string, onConfirm: () => void, onCancel?: () => void) {
    const event = new CustomEvent(SHOW_CONFIRM_EVENT, {
      detail: { id: Math.random().toString(), message, onConfirm, onCancel }
    });
    window.dispatchEvent(event);
  }
};

export const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  if (type === 'error') {
    toast.error(message);
  } else if (type === 'success') {
    toast.success(message);
  } else {
    toast.info(message);
  }
};

