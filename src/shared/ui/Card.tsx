import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'advice';
}

export function Card({ variant = 'default', className, ...rest }: CardProps) {
  const classes = [styles.card, styles[variant], className].filter(Boolean).join(' ');
  return <div className={classes} {...rest} />;
}
