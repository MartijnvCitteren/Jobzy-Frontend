import { describe, expect, it } from 'vitest';
import { buildRegisterSteps, firstStepWithError, type StepField } from './steps';

const field = (name: string, extra: Partial<StepField> = {}): StepField => ({
  name,
  inputType: undefined,
  hasError: false,
  ...extra,
});

// The order Keycloakify's useUserProfileForm produces for our realm: the profile order
// (email, firstName, lastName) with password + confirmation inserted after email.
const keycloakOrder = [
  field('email'),
  field('password'),
  field('password-confirm'),
  field('firstName'),
  field('lastName'),
];

describe('buildRegisterSteps', () => {
  it('asks first name, last name, work email, then the password, one step each', () => {
    const steps = buildRegisterSteps(keycloakOrder);

    expect(steps.map((step) => step.fieldNames)).toEqual([
      ['firstName'],
      ['lastName'],
      ['email'],
      ['password', 'password-confirm'],
    ]);
  });

  it('gives each step the id of its first field', () => {
    expect(buildRegisterSteps(keycloakOrder).map((step) => step.id)).toEqual([
      'firstName',
      'lastName',
      'email',
      'password',
    ]);
  });

  it('adds a step for a custom User Profile attribute, after the known fields and before the password', () => {
    const steps = buildRegisterSteps([...keycloakOrder, field('companyName')]);

    expect(steps.map((step) => step.id)).toEqual(['firstName', 'lastName', 'email', 'companyName', 'password']);
  });

  it('leaves hidden attributes out of the steps', () => {
    const steps = buildRegisterSteps([...keycloakOrder, field('locale', { inputType: 'hidden' })]);

    expect(steps.flatMap((step) => step.fieldNames)).not.toContain('locale');
  });

  it('has no password step when Keycloak does not ask for one (e.g. registering via a social provider)', () => {
    const steps = buildRegisterSteps([field('email'), field('firstName'), field('lastName')]);

    expect(steps.map((step) => step.id)).toEqual(['firstName', 'lastName', 'email']);
  });
});

describe('firstStepWithError', () => {
  it('opens on the first step that has an error, e.g. "email already exists" from the server', () => {
    const fields = keycloakOrder.map((f) => (f.name === 'email' ? { ...f, hasError: true } : f));

    expect(firstStepWithError(buildRegisterSteps(fields), fields)).toBe(2);
  });

  it('opens on the first step when nothing is wrong', () => {
    expect(firstStepWithError(buildRegisterSteps(keycloakOrder), keycloakOrder)).toBe(0);
  });
});
