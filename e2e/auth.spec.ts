import { test, expect } from '@playwright/test';

/**
 * E2E tests for the authentication flow.
 *
 * API calls are mocked so tests are deterministic and don't depend on
 * .env configuration. The auth gate shows PasswordCard when
 * /api/auth/check returns 401, and /api/auth/login returns 401 for
 * wrong passwords.
 */

test.beforeEach(async ({ page }) => {
  // Mock auth check — always not authenticated
  await page.route('**/api/auth/check', (route) =>
    route.fulfill({ status: 401, json: { ok: false } })
  );
});

test.describe('Auth gate — password card', () => {
  test('page loads and shows password card', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Acceso restringido')).toBeVisible();
    await expect(page.locator('#gate-password')).toBeVisible();
  });

  test('sede selector shows current sede', async ({ page }) => {
    await page.goto('/');
    const sedeButton = page.locator('#gate-sede');
    await expect(sedeButton).toBeVisible();
    // Default sede is CCYS
    await expect(sedeButton).toContainText('CCYS');
  });

  test('password input accepts text', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#gate-password');
    await input.fill('test-password-123');
    await expect(input).toHaveValue('test-password-123');
  });

  test('show/hide password toggle works', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#gate-password');
    await input.fill('secret');

    // Password type by default
    await expect(input).toHaveAttribute('type', 'password');

    // Click the eye toggle — initially shows "Mostrar contraseña"
    const toggle = page.getByRole('button', { name: 'Mostrar contraseña' });
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');

    // Toggle back — now shows "Ocultar contraseña"
    const toggleOff = page.getByRole('button', { name: 'Ocultar contraseña' });
    await toggleOff.click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('submit with empty password shows validation error', async ({ page }) => {
    await page.goto('/');
    // Wait for password card to appear
    await expect(page.getByText('Acceso restringido')).toBeVisible();

    // Click submit without entering password
    const submit = page.getByRole('button', { name: 'Entrar' });
    await submit.click();
    await expect(page.locator('#gate-error')).toHaveText('Ingresá la contraseña');
  });

  test('submit with wrong password shows error from API', async ({ page }) => {
    // Mock login API — wrong password
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        json: { ok: false, error: 'Contraseña incorrecta' },
      })
    );

    await page.goto('/');
    await expect(page.getByText('Acceso restringido')).toBeVisible();

    const input = page.locator('#gate-password');
    await input.fill('definitely-wrong-password');

    const submit = page.getByRole('button', { name: 'Entrar' });
    await submit.click();

    await expect(page.getByText('Contraseña incorrecta')).toBeVisible();
  });

  test('footer text is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Cauca 2026/)).toBeVisible();
  });
});
