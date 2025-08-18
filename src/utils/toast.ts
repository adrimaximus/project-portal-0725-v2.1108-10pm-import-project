import { toast } from "sonner";

type ToastOptions = {
  id?: string | number;
  description?: React.ReactNode;
  duration?: number;
};

export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    id: options?.id,
    description: options?.description,
    duration: options?.duration || 3000,
  });
};

export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    id: options?.id,
    description: options?.description,
    duration: options?.duration || 5000,
  });
};

export const showInfo = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    id: options?.id,
    description: options?.description,
    duration: options?.duration || 4000,
  });
};

export const showWarning = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    id: options?.id,
    description: options?.description,
    duration: options?.duration || 4000,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};