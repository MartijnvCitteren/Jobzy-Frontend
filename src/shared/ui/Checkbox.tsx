import { Check } from 'lucide-react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className={styles.label}>
      <span className={styles.wrapper}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.box}>{checked && <Check size={12} aria-hidden="true" />}</span>
      </span>
      {label}
    </label>
  );
}
