import { useId } from 'react';
import styles from './fields.module.css';

export interface NumberFieldProps {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
  error?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function NumberField({ label, value, onChange, error, min, max, disabled }: NumberFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        className={styles.control}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? '' : Number(raw));
        }}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
