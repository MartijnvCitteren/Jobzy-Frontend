/**
 * The register page asks one question per screen (design: hr-signup hi-fi spec), but Keycloak
 * expects every field in a single POST. So all fields stay in one <form>; a "step" only
 * decides which of them is visible.
 *
 * Steps are derived from the User Profile attributes Keycloak sends, not hard-coded: a new
 * attribute in the realm's User Profile gets its own step without code changes.
 */

export interface StepField {
  name: string;
  inputType: string | undefined;
  hasError: boolean;
}

export interface RegisterStep {
  /** The name of the step's first field; also keys its question copy and illustration. */
  id: string;
  fieldNames: string[];
}

/** Asked first, in this order; any other attribute follows in profile order. */
const LEADING_FIELDS = ['firstName', 'lastName', 'email'];
/** Always the last step, together. */
const PASSWORD_FIELDS = ['password', 'password-confirm'];

export function buildRegisterSteps(fields: StepField[]): RegisterStep[] {
  const visible = fields.filter((field) => field.inputType !== 'hidden');
  const names = visible.map((field) => field.name);

  const leading = LEADING_FIELDS.filter((name) => names.includes(name));
  const others = names.filter((name) => !LEADING_FIELDS.includes(name) && !PASSWORD_FIELDS.includes(name));
  const password = PASSWORD_FIELDS.filter((name) => names.includes(name));

  const steps = [...leading, ...others].map((name) => ({ id: name, fieldNames: [name] }));
  if (password.length > 0) {
    steps.push({ id: password[0], fieldNames: password });
  }
  return steps;
}

/** Index of the first step with an error, so a page Keycloak sends back opens where the problem is. */
export function firstStepWithError(steps: RegisterStep[], fields: StepField[]): number {
  const erroneous = new Set(fields.filter((field) => field.hasError).map((field) => field.name));
  const index = steps.findIndex((step) => step.fieldNames.some((name) => erroneous.has(name)));
  return Math.max(index, 0);
}
