import { useId } from 'react';
import styles from './fields.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Short mono badge (e.g. an ISO2 country code) shown between the control text and the chevron. */
  suffix?: string;
}

export function Select({ label, options, value, onChange, error, placeholder, disabled, suffix }: SelectProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.controlWrapper}>
        <select
          id={id}
          className={`${styles.control}${suffix ? ` ${styles.controlWithSuffix}` : ''}`}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {suffix && (
          <span className={styles.suffix} aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
