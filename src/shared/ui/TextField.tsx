import { useId, type HTMLInputAutoCompleteAttribute, type ReactNode, type Ref } from 'react';
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
  /** Native form attributes, for fields posted by a plain <form> (e.g. the Keycloak theme). */
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password';
  autoComplete?: HTMLInputAutoCompleteAttribute;
  /** Announced as required (aria-required); validation stays with the caller. */
  required?: boolean;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement & HTMLTextAreaElement>;
  /** A control rendered inside the field's right edge, e.g. a show-password toggle. */
  trailing?: ReactNode;
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
  id: idProp,
  name,
  type,
  autoComplete,
  required,
  onBlur,
  inputRef,
  trailing,
}: TextFieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const Element = multiline ? 'textarea' : 'input';
  const labelClassName = [styles.label, boldLabel && styles.labelBold, hideLabel && styles.srOnly]
    .filter(Boolean)
    .join(' ');
  const showHelper = Boolean(helperText) && !error;

  const control = (
    <Element
      ref={inputRef}
      id={id}
      name={name}
      type={multiline ? undefined : type}
      autoComplete={autoComplete}
      className={[styles.control, trailing && styles.controlWithTrailing].filter(Boolean).join(' ')}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      aria-required={required || undefined}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : showHelper ? helperId : undefined}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  );

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {trailing ? (
        <div className={styles.trailingWrapper}>
          {control}
          <span className={styles.trailing}>{trailing}</span>
        </div>
      ) : (
        control
      )}
      {showHelper && (
        <p id={helperId} className={styles.label}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
