import React, { createContext, useContext, useState } from 'react';
import { clsx } from 'clsx';

// Context
const DialogContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

// Root
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
};

// Trigger
interface DialogTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const { setOpen } = useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      setOpen(true);
    },
  });
};

// Content – siempre centrado en pantalla per AGENTS.md
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, className, ...props }) => {
  const { open, setOpen } = useContext(DialogContext);
  if (!open) return null;
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Panel – siempre centrado */}
      <div
        className={clsx(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'pointer-events-none'
        )}
      >
        <div
          className={clsx(
            'relative pointer-events-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl',
            className
          )}
          {...props}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl leading-none"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </>
  );
};

// Header
export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={clsx('flex flex-col space-y-1.5 mb-4', className)} {...props} />
);

// Title
export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={clsx('text-lg font-semibold text-slate-900', className)} {...props} />
);

// Description
export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={clsx('text-sm text-slate-500', className)} {...props} />
);
