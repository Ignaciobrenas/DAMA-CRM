import { useState, useCallback } from 'react';
import { ValidationResult } from '../utils/validators';

export type ValidatorMap<T> = {
  [K in keyof T]?: (value: any, allValues?: T) => ValidationResult;
};

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validators: ValidatorMap<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, val: any, currentValues?: T): boolean => {
      const validator = validators[field];
      if (!validator) return true;

      const res = validator(val, currentValues || values);
      if (!res.isValid) {
        setErrors((prev) => ({ ...prev, [field]: res.message }));
        return false;
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return true;
      }
    },
    [validators, values]
  );

  const setFieldValue = useCallback(
    (field: keyof T, val: any) => {
      setValues((prev) => {
        const next = { ...prev, [field]: val };
        if (touched[field]) {
          validateField(field, val, next);
        }
        return next;
      });
    },
    [touched, validateField]
  );

  const setFieldTouched = useCallback(
    (field: keyof T, isTouched = true) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
      if (isTouched) {
        validateField(field, values[field]);
      }
    },
    [validateField, values]
  );

  const validateAll = useCallback((): boolean => {
    let allValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};
    const newTouched: Partial<Record<keyof T, boolean>> = {};

    for (const field of Object.keys(validators) as Array<keyof T>) {
      newTouched[field] = true;
      const validator = validators[field];
      if (validator) {
        const res = validator(values[field], values);
        if (!res.isValid) {
          allValid = false;
          newErrors[field] = res.message;
        }
      }
    }

    setTouched(newTouched);
    setErrors(newErrors);
    return allValid;
  }, [validators, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateAll,
    resetForm,
    isValid: Object.keys(errors).length === 0,
  };
}
