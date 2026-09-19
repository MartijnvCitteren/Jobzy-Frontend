import styles from './Stepper.module.css';

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className={styles.list}>
      {steps.map((step, index) => {
        const status = index === currentIndex ? 'active' : 'inactive';
        return (
          <li key={step.label} className={styles.item} data-status={status}>
            <span className={styles.circle}>{index + 1}</span>
            <span className={styles.label}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
