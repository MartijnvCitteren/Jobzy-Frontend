import styles from './CardHeader.module.css';

export interface CardHeaderProps {
  title: string;
  description?: string;
  /** Heading level for the title — h2 by default, h3 for a nested sub-card heading. */
  level?: 2 | 3;
}

export function CardHeader({ title, description, level = 2 }: CardHeaderProps) {
  const Heading = level === 3 ? 'h3' : 'h2';
  return (
    <div className={styles.header}>
      <Heading className={styles.title}>{title}</Heading>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
