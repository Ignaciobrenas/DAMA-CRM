import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmModal } from '../components/common/ConfirmModal';

export interface ConfirmDialogOptions {
  title: string;
  description?: string;
  message?: string;
  entityName?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ConfirmDialogOptions & { isOpen: boolean }>({
    isOpen: false,
    title: '',
    description: '',
    variant: 'danger',
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        ...options,
        isOpen: true,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalState.title}
        description={modalState.description || modalState.message}
        entityName={modalState.entityName}
        confirmText={modalState.confirmText || modalState.confirmLabel}
        cancelText={modalState.cancelText || modalState.cancelLabel}
        variant={modalState.variant || 'danger'}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
