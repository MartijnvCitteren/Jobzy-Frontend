import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextField, type TextFieldProps } from './TextField';
import styles from './fields.module.css';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'multiline' | 'trailing'> {
  /** Accessible names for the reveal toggle, in the caller's language. */
  toggleLabels: { show: string; hide: string };
}

export function PasswordField({ toggleLabels, ...fieldProps }: PasswordFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const Icon = isRevealed ? EyeOff : Eye;

  return (
    <TextField
      {...fieldProps}
      type={isRevealed ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-label={isRevealed ? toggleLabels.hide : toggleLabels.show}
          aria-controls={fieldProps.id}
          onClick={() => setIsRevealed((revealed) => !revealed)}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      }
    />
  );
}
