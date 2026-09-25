import type { ReactNode } from 'react';
import styles from './ChoiceCard.module.css';

export interface ChoiceCardProps {
  icon: ReactNode;
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
  variant?: 'default' | 'advice';
}

export function ChoiceCard({ icon, title, body, selected, onSelect, variant = 'default' }: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      data-variant={variant}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {variant === 'advice' ? (
        <span className={styles.iconChip}>{icon}</span>
      ) : (
        <span className={styles.icon}>{icon}</span>
      )}
      <span className={styles.title}>{title}</span>
      <span className={styles.body}>{body}</span>
    </button>
  );
}
