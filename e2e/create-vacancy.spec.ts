import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080';

test.describe('create-vacancy happy path', () => {
  test('fills all 4 steps and completes the wizard (manual description path)', async ({ page }) => {
    await page.route('**/config.json', async (route) => {
      await route.fulfill({ json: { apiBaseUrl: API_BASE_URL } });
    });

    await page.route(`${API_BASE_URL}/vacancy`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'vacancy-e2e-1',
          status: 'DRAFT',
          jobTitle: 'Senior Backend Developer',
          category: 'ENGINEERING',
          location: { country: 'NL', city: 'Amsterdam' },
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
          createdAt: '2026-09-19T00:00:00Z',
        }),
      });
    });

    await page.route(`${API_BASE_URL}/vacancy/vacancy-e2e-1/description`, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ summary: 'Written by hand for the e2e test' }),
      });
    });

    await page.route(`${API_BASE_URL}/vacancy/vacancy-e2e-1`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'vacancy-e2e-1',
          status: 'DRAFT',
          jobTitle: 'Senior Backend Developer',
          category: 'ENGINEERING',
          location: { country: 'NL', city: 'Amsterdam' },
          workplaceType: 'HYBRID',
          minHoursPerWeek: 24,
          maxHoursPerWeek: 36,
          createdAt: '2026-09-19T00:00:00Z',
          contactPerson: { name: 'Jane Doe', email: 'jane@example.com' },
          offer: { salaryMin: 3000, salaryMax: 4000, currency: 'EUR', salaryPeriod: 'MONTHLY' },
        }),
      });
    });

    await page.goto('/vacancies/new');

    // Step 1: Basisgegevens
    await expect(page.getByRole('heading', { name: 'Basisgegevens' })).toBeVisible();
    await page.getByLabel('Functietitel').fill('Senior Backend Developer');
    await page.getByLabel('Categorie').selectOption('ENGINEERING');
    await page.getByLabel('Land').selectOption('NL');
    await page.getByLabel('Stad').fill('Amsterdam');
    await page.getByRole('button', { name: 'Hybride' }).click();
    await page.getByLabel('Uren per week (minimum)').fill('24');
    await page.getByLabel('Uren per week (maximum)').fill('36');
    await page.getByRole('button', { name: 'Volgende' }).click();

    // Step 2: Vacaturetekst (manual path, skipping AI generation)
    await expect(page.getByRole('heading', { name: 'Vacaturetekst' })).toBeVisible();
    await page.getByLabel('Samenvatting').fill('Written by hand for the e2e test');
    await page.getByRole('button', { name: 'Volgende' }).click();

    // Step 3: Contact en voorwaarden
    await expect(page.getByRole('heading', { name: 'Contact en voorwaarden' })).toBeVisible();
    await page.getByLabel('Naam').fill('Jane Doe');
    await page.getByLabel('E-mailadres').fill('jane@example.com');
    await page.getByRole('button', { name: 'Volgende' }).click();

    // Step 4: Overzicht
    await expect(page.getByRole('heading', { name: 'Overzicht' })).toBeVisible();
    await expect(page.getByText('Senior Backend Developer')).toBeVisible();
    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltooien' })).toBeVisible();

    await page.getByRole('button', { name: 'Voltooien' }).click();
  });
});
