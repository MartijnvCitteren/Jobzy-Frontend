import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width: string | number;
  height: string | number;
}

export function Skeleton({ width, height }: SkeletonProps) {
  return <div className={styles.bar} role="presentation" style={{ width, height }} />;
}
