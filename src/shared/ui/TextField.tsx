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
}: TextFieldProps) {
  const id = useId();
  const Element = multiline ? 'textarea' : 'input';
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
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
