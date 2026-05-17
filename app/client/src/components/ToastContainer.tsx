import { useToastStore } from '@/stores/toast-store';

export function ToastContainer() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div className="toast__message">{toast.message}</div>
          <div className="toast__actions">
            {toast.type === 'confirm' && (
              <>
                <button
                  className="toast__btn toast__btn--confirm"
                  onClick={() => {
                    toast.onConfirm?.();
                    dismissToast(toast.id);
                  }}
                >
                  {toast.confirmLabel ?? 'Confirm'}
                </button>
                <button
                  className="toast__btn toast__btn--cancel"
                  onClick={() => dismissToast(toast.id)}
                >
                  Cancel
                </button>
              </>
            )}
            {toast.type !== 'confirm' && (
              <button className="toast__btn toast__btn--dismiss" onClick={() => dismissToast(toast.id)}>
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
