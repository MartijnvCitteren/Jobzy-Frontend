import { Check } from 'lucide-react';
import styles from './Stepper.module.css';

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  isReachable?: (index: number) => boolean;
}

export function Stepper({ steps, currentIndex, onStepClick, isReachable }: StepperProps) {
  return (
    <ol className={styles.list}>
      {steps.map((step, index) => {
        const status = index === currentIndex ? 'active' : index < currentIndex ? 'done' : 'inactive';
        const reachable = isReachable ? isReachable(index) : true;
        return (
          <li key={step.label} className={styles.itemWrapper}>
            <div className={styles.item} data-status={status}>
              <button
                type="button"
                className={styles.itemButton}
                disabled={!reachable}
                onClick={() => onStepClick?.(index)}
              >
                <span className={styles.circle}>
                  {status === 'done' ? <Check size={14} aria-hidden="true" /> : index + 1}
                </span>
                <span className={styles.label}>{step.label}</span>
              </button>
            </div>
            {index < steps.length - 1 && (
              <span className={styles.connector} data-done={status === 'done'} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
