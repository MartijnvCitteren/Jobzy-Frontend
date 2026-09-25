import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message: string | undefined;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) {
    return null;
  }
  return (
    <div className={styles.banner} role="alert">
      {message}
    </div>
  );
}
