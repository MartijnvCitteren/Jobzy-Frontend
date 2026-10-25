import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Posted field name, for checkboxes in a plain <form> (e.g. the Keycloak theme). */
  name?: string;
  error?: string;
}

export function Checkbox({ label, checked, onChange, name, error }: CheckboxProps) {
  const errorId = `${useId()}-error`;
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        <span className={styles.wrapper}>
          <input
            type="checkbox"
            name={name}
            className={styles.input}
            checked={checked}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className={styles.box}>{checked && <Check size={12} aria-hidden="true" />}</span>
        </span>
        {label}
      </label>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
