/**
 * User Profile "pattern" validators are Java regexes (Keycloak validates them server-side).
 * Keycloakify re-checks them in the browser with a bare `new RegExp(pattern)`, which breaks on
 * Java-only syntax: a leading `(?i)` throws, and `\p{L}` without the `u` flag silently never
 * matches. Such patterns are taken out of Keycloakify's check and run here instead, translated
 * to an equivalent JavaScript RegExp. Keycloak still validates every pattern on submit.
 */

const INLINE_CASE_INSENSITIVE = '(?i)';
const UNICODE_PROPERTY = /\\[pP]\{/;

export function isJavaOnlyPattern(pattern: string): boolean {
  return pattern.startsWith(INLINE_CASE_INSENSITIVE) || UNICODE_PROPERTY.test(pattern);
}

export function toJsRegExp(pattern: string): RegExp {
  if (pattern.startsWith(INLINE_CASE_INSENSITIVE)) {
    return new RegExp(pattern.slice(INLINE_CASE_INSENSITIVE.length), 'iu');
  }
  return new RegExp(pattern, 'u');
}

interface PatternValidator {
  pattern: string;
  'error-message'?: string;
}

interface AttributeLike {
  validators: { pattern?: PatternValidator };
}

export interface JavaPattern {
  regExp: RegExp;
  /** Message key from the validator's "error-message", if the realm set one. */
  errorMessageKey: string | undefined;
}

/**
 * Splits Java-only pattern validators off the User Profile attributes: returns the attributes
 * without them (for Keycloakify) and the translated patterns by attribute name (checked here).
 */
export function extractJavaPatterns<A extends AttributeLike>(
  attributesByName: Record<string, A>,
): { attributesByName: Record<string, A>; javaPatterns: Record<string, JavaPattern> } {
  const javaPatterns: Record<string, JavaPattern> = {};
  const safeAttributes = Object.fromEntries(
    Object.entries(attributesByName).map(([name, attribute]) => {
      const pattern = attribute.validators.pattern;
      if (!pattern || !isJavaOnlyPattern(pattern.pattern)) {
        return [name, attribute];
      }
      javaPatterns[name] = { regExp: toJsRegExp(pattern.pattern), errorMessageKey: pattern['error-message'] };
      const otherValidators = { ...attribute.validators };
      delete otherValidators.pattern;
      return [name, { ...attribute, validators: otherValidators }];
    }),
  );
  return { attributesByName: safeAttributes, javaPatterns };
}
