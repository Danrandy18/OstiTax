import { test, expect } from '@playwright/test';

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.badge-attempts')).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole('button', {
      name: /jetzt berechnen|berechnen|calculate now|calculate|calcular ahora|calcular|hesapla|izračunaj|обрахувати/i,
    }),
  ).toBeVisible();
}

async function submitCalculation(page: import('@playwright/test').Page) {
  await page
    .getByRole('button', {
      name: /jetzt berechnen|berechnen|calculate now|calculate|calcular ahora|calcular|hesapla|izračunaj|обрахувати/i,
    })
    .click();
  await expect(page.locator('.breakdown .net-row dd')).toBeVisible({
    timeout: 15_000,
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('NettoKlar', () => {
  test('carga la aplicación con título y formulario', async ({ page }) => {
    await waitForAppReady(page);

    await expect(page).toHaveTitle(/NettoKlar/i);
    await expect(page.getByText('NettoKlar').first()).toBeVisible();
    await expect(
      page.getByLabel(/Brutto monatlich|Monthly gross|Bruto mensual|Bruttobezug|Gross salary|Salario bruto/i),
    ).toBeVisible();
    await expect(page.getByText(/Ich bin|I am|Yo soy/i).first()).toBeVisible();
    await expect(page.getByText(/Sachbezug|benefit in kind|especie|ayni|naturi|натуральн/i).first()).toBeVisible();
    await expect(page.locator('.badge-attempts')).toContainText(
      /Gratis-Versuche|Free tries|Intentos gratis/i,
    );
  });

  test('calcula 3.000 € Wien → netto 2.168,83 €', async ({ page }) => {
    await waitForAppReady(page);

    await page
      .getByLabel(/Brutto monatlich|Monthly gross|Bruto mensual|Bruttobezug|Gross salary|Salario bruto/i)
      .fill('3000');
    await submitCalculation(page);

    await expect(page.locator('.breakdown .net-row dd')).toContainText(
      /2[.,]168[.,]83/,
    );
    await expect(page.locator('.badge-attempts')).toContainText(/: 2/);
  });

  test('cambiar idioma no modifica los intentos restantes', async ({
    page,
  }) => {
    await waitForAppReady(page);

    await page
      .getByLabel(/Brutto monatlich|Monthly gross|Bruto mensual|Bruttobezug|Gross salary|Salario bruto/i)
      .fill('3000');
    await submitCalculation(page);

    await expect(page.locator('.badge-attempts')).toContainText(/: 2/);

    await page.locator('.lang-select select').selectOption('en');

    await expect(page.getByRole('button', { name: /Calculate now|Calculate/i })).toBeVisible();
    await expect(page.locator('.badge-attempts')).toContainText(
      'Free tries left: 2',
    );
  });

  test('agota intentos gratuitos y muestra modal de pago', async ({
    page,
  }) => {
    await waitForAppReady(page);

    await page
      .getByLabel(/Brutto monatlich|Monthly gross|Bruto mensual|Bruttobezug|Gross salary|Salario bruto/i)
      .fill('3000');

    for (let i = 0; i < 3; i++) {
      await submitCalculation(page);
    }

    await expect(page.locator('.badge-attempts')).toContainText(/: 0/);

    await page
      .getByRole('button', { name: /jetzt berechnen|berechnen|calculate now|calculate|calcular/i })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /Pro freischalten|Unlock Pro|Desbloquear Pro/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Stripe/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PayPal/i })).toBeVisible();
  });

  test('muestra desglose en pestañas 13.º y 14.º', async ({ page }) => {
    await waitForAppReady(page);

    await page
      .getByLabel(/Brutto monatlich|Monthly gross|Bruto mensual|Bruttobezug|Gross salary|Salario bruto/i)
      .fill('3000');
    await submitCalculation(page);

    await page.getByRole('tab', { name: /13\.|13th|13\.º/i }).click();
    await expect(page.locator('.breakdown .net-row dd')).toContainText(
      /2[.,]375[.,]83/,
    );

    await page.getByRole('tab', { name: /14\.|14th|14\.º/i }).click();
    await expect(page.locator('.breakdown .net-row dd')).toContainText(
      /2[.,]338[.,]6/,
    );
  });
});
