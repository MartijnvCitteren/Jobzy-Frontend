import { useId } from 'react';
import styles from './fields.module.css';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Bolds this field's label — scoped opt-in for callers like the 3-questions modal (design README's "weight 600" spec), not a global label-weight change. */
  boldLabel?: boolean;
  /** Visually hides the label (sr-only) while keeping it as the accessible name — for callers like review-vacancy's per-section edit mode, where a visible section header already serves as the label. */
  hideLabel?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  maxLength,
  multiline,
  disabled,
  helperText,
  boldLabel,
  hideLabel,
}: TextFieldProps) {
  const id = useId();
  const Element = multiline ? 'textarea' : 'input';
  const labelClassName = [styles.label, boldLabel && styles.labelBold, hideLabel && styles.srOnly]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <Element
        id={id}
        className={styles.control}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText && !error && <p className={styles.label}>{helperText}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
