import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DeepPartial } from 'keycloakify/tools/DeepPartial';
import type { KcContext } from '../KcContext';
import { getKcContextMock } from '../KcPageStory';
import KcPage from '../KcPage';

// Injects Keycloak's server-side scripts (session polling, reCAPTCHA); nothing to load in jsdom.
vi.mock('keycloakify/login/Template.useInitialize', () => ({ useInitialize: () => ({ isReadyToRender: true }) }));

type RegisterContext = Extract<KcContext, { pageId: 'register.ftl' }>;

function renderRegister(overrides?: DeepPartial<RegisterContext>) {
  const kcContext = getKcContextMock({ pageId: 'register.ftl', overrides });
  render(<KcPage kcContext={kcContext} />);
  return { user: userEvent.setup(), kcContext };
}

/** Keycloak's messagesPerField for a page it sent back with errors on some fields. */
function serverErrors(errors: Record<string, string>) {
  return {
    existsError: (...names: string[]) => names.some((name) => name in errors),
    get: (name: string) => errors[name] ?? '',
    exists: (name: string) => name in errors,
  };
}

const next = () => screen.getByRole('button', { name: 'Volgende' });

/**
 * For each form submit: whether the page let it through to Keycloak. Listens on window, so it
 * runs after React's handler; then stops the post itself, since jsdom can't navigate.
 */
let postListener: ((event: Event) => void) | undefined;

function recordPosts(): boolean[] {
  const posted: boolean[] = [];
  postListener = (event: Event) => {
    posted.push(!event.defaultPrevented);
    event.preventDefault();
  };
  window.addEventListener('submit', postListener);
  return posted;
}

afterEach(() => {
  if (postListener) {
    window.removeEventListener('submit', postListener);
    postListener = undefined;
  }
});

describe('Register', () => {
  it('opens on the first question, in Dutch by default', async () => {
    renderRegister();

    expect(await screen.findByRole('heading', { name: 'Hoe heet je?' })).toBeInTheDocument();
    expect(screen.getByText('Stap 1 van 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Voornaam')).toHaveAttribute('autocomplete', 'given-name');
  });

  it('keeps you on the step and explains what is missing when the field is empty', async () => {
    const { user } = renderRegister();
    await screen.findByRole('heading', { name: 'Hoe heet je?' });

    await user.click(next());

    expect(screen.getByRole('heading', { name: 'Hoe heet je?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Voornaam')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Voornaam')).toHaveAccessibleDescription('Vul dit veld nog even in.');
  });

  it('accepts a real name (the realm pattern uses Java-only \\p{L}) and moves on; the arrow goes back', async () => {
    const { user } = renderRegister();
    await user.type(await screen.findByLabelText('Voornaam'), 'Zoë');

    await user.click(next());

    expect(screen.getByRole('heading', { name: 'En je achternaam?' })).toBeInTheDocument();
    expect(screen.getByText('Stap 2 van 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Achternaam')).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Vorige stap' }));

    expect(screen.getByRole('heading', { name: 'Hoe heet je?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Voornaam')).toHaveValue('Zoë');
  });

  it('asks for a work email and turns down public mail providers right at that step', async () => {
    const { user } = renderRegister();
    await user.type(await screen.findByLabelText('Voornaam'), 'Sanne');
    await user.click(next());
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries');
    await user.click(next());

    expect(screen.getByRole('heading', { name: 'Wat is je werkmailadres?' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('E-mailadres'), 'sanne@Gmail.com');
    await user.click(next());

    expect(screen.getByRole('heading', { name: 'Wat is je werkmailadres?' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mailadres')).toHaveAccessibleDescription(
      'Gebruik je werkmailadres. Adressen van publieke mailproviders kunnen we niet gebruiken.',
    );
  });

  it('moves on with Enter, like the button', async () => {
    const { user } = renderRegister();
    await user.type(await screen.findByLabelText('Voornaam'), 'Sanne{Enter}');

    expect(screen.getByRole('heading', { name: 'En je achternaam?' })).toBeInTheDocument();
  });

  it('shows the password policy and posts every field in one form to Keycloak', async () => {
    const { user, kcContext } = renderRegister();
    await user.type(await screen.findByLabelText('Voornaam'), 'Sanne{Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
    await user.type(screen.getByLabelText('E-mailadres'), 'sanne@bedrijf.nl{Enter}');

    expect(screen.getByRole('heading', { name: 'Kies een wachtwoord' })).toBeInTheDocument();
    expect(screen.getByLabelText('Wachtwoord')).toHaveAccessibleDescription('Minimaal 12 tekens.');

    await user.type(screen.getByLabelText('Wachtwoord'), 'lang-genoeg-wachtwoord');
    await user.type(screen.getByLabelText('Bevestig wachtwoord'), 'lang-genoeg-wachtwoord');

    const form = document.getElementById('kc-register-form') as HTMLFormElement;
    const posted = recordPosts();
    await user.click(screen.getByRole('button', { name: 'Account aanmaken' }));

    expect(posted).toEqual([true]);
    expect(form.getAttribute('action')).toBe(kcContext.url.registrationAction);
    expect(Object.fromEntries(new FormData(form))).toMatchObject({
      firstName: 'Sanne',
      lastName: 'de Vries',
      email: 'sanne@bedrijf.nl',
      password: 'lang-genoeg-wachtwoord',
      'password-confirm': 'lang-genoeg-wachtwoord',
    });
  });

  it('shows one message per field: an empty confirmation asks to be filled in, not that it differs', async () => {
    const { user } = renderRegister();
    await user.type(await screen.findByLabelText('Voornaam'), 'Sanne{Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
    await user.type(screen.getByLabelText('E-mailadres'), 'sanne@bedrijf.nl{Enter}');
    await user.type(screen.getByLabelText('Wachtwoord'), 'lang-genoeg-wachtwoord');

    await user.click(screen.getByRole('button', { name: 'Account aanmaken' }));

    expect(screen.getByLabelText('Bevestig wachtwoord')).toHaveAccessibleDescription('Vul dit veld nog even in.');
    expect(screen.getByLabelText('Bevestig wachtwoord')).toHaveFocus();
  });

  it('asks to accept the terms on the last step when the realm requires it, and only then submits', async () => {
    const { user } = renderRegister({ termsAcceptanceRequired: true });
    await user.type(await screen.findByLabelText('Voornaam'), 'Sanne{Enter}');
    await user.type(screen.getByLabelText('Achternaam'), 'de Vries{Enter}');
    await user.type(screen.getByLabelText('E-mailadres'), 'sanne@bedrijf.nl{Enter}');
    await user.type(screen.getByLabelText('Wachtwoord'), 'lang-genoeg-wachtwoord');
    await user.type(screen.getByLabelText('Bevestig wachtwoord'), 'lang-genoeg-wachtwoord');

    const form = document.getElementById('kc-register-form') as HTMLFormElement;
    const posted = recordPosts();
    await user.click(screen.getByRole('button', { name: 'Account aanmaken' }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Account aanmaken' }));

    expect(posted).toEqual([false, true]);
    expect(new FormData(form).get('termsAccepted')).toBe('on');
  });

  it('opens on the email step when Keycloak reports the address already exists', async () => {
    renderRegister({
      profile: {
        attributesByName: {
          firstName: { value: 'Sanne' },
          lastName: { value: 'de Vries' },
          email: { value: 'sanne@bedrijf.nl' },
        },
      },
      messagesPerField: serverErrors({ email: 'Er is al een account met dit e-mailadres.' }),
    });

    expect(await screen.findByRole('heading', { name: 'Wat is je werkmailadres?' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mailadres')).toHaveAccessibleDescription('Er is al een account met dit e-mailadres.');
  });

  it('shows a global error from Keycloak as an alert', async () => {
    renderRegister({
      message: { type: 'error', summary: 'Er ging iets mis aan onze kant. Probeer het zo weer.' },
      messagesPerField: serverErrors({ global: 'Er ging iets mis aan onze kant. Probeer het zo weer.' }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Er ging iets mis aan onze kant. Probeer het zo weer.');
  });

  it('speaks English when that is the chosen language', async () => {
    renderRegister({ locale: { currentLanguageTag: 'en' } });

    expect(await screen.findByRole('heading', { name: "What's your first name?" })).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('links back to login', async () => {
    const { kcContext } = renderRegister();

    expect(await screen.findByRole('link', { name: 'Inloggen' })).toHaveAttribute('href', kcContext.url.loginUrl);
  });
});
