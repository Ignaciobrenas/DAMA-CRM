import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ValidationResult } from '../../utils/validators';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  validator?: (value: string) => ValidationResult;
  onValidationChange?: (isValid: boolean, message?: string) => void;
  helperText?: string;
  showSuccessBadge?: boolean;
  leftIcon?: React.ReactNode;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value = '',
  onChange,
  onBlur,
  validator,
  onValidationChange,
  error: externalError,
  helperText,
  showSuccessBadge = true,
  leftIcon,
  className = '',
  type = 'text',
  disabled,
  required,
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | undefined>(undefined);
  const [isTouched, setIsTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const stringValue = String(value || '');

  // Perform validation
  useEffect(() => {
    if (!validator) return;

    if (!isTouched && !stringValue) {
      setInternalError(undefined);
      if (onValidationChange) onValidationChange(true);
      return;
    }

    const res = validator(stringValue);
    if (!res.isValid) {
      setInternalError(res.message);
      if (onValidationChange) onValidationChange(false, res.message);
    } else {
      setInternalError(undefined);
      if (onValidationChange) onValidationChange(true);
    }
  }, [stringValue, isTouched, validator]);

  const activeError = externalError || (isTouched ? internalError : undefined);
  const isValid = validator ? isTouched && !internalError && stringValue.length > 0 : false;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTouched(true);
    if (validator) {
      const res = validator(stringValue);
      setInternalError(res.isValid ? undefined : res.message);
    }
    if (onBlur) onBlur(e);
  };

  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        </div>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none shrink-0">
            {leftIcon}
          </div>
        )}

        <input
          {...props}
          type={effectiveType}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={`w-full text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all outline-none placeholder:text-slate-400 ${
            leftIcon ? 'pl-9' : 'pl-3.5'
          } ${
            isPasswordType || (isValid && showSuccessBadge) || activeError ? 'pr-9' : 'pr-3.5'
          } py-2.5 ${
            activeError
              ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500'
              : isValid && showSuccessBadge
              ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
              : 'border-slate-200 dark:border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : ''} ${className}`}
        />

        {/* Right Status Badge / Password Toggle */}
        <div className="absolute right-3 flex items-center space-x-1.5 pointer-events-auto">
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {!isPasswordType && activeError && (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 animate-in fade-in" />
          )}

          {!isPasswordType && isValid && showSuccessBadge && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 animate-in fade-in" />
          )}
        </div>
      </div>

      {/* Helper text or error message */}
      {activeError ? (
        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-in fade-in">
          <span>{activeError}</span>
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
