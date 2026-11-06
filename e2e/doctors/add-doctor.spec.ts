import { test, expect } from '../fixtures/test';

/**
 * Visual & Functional E2E Test Suite: Add Doctor Workflow
 *
 * Configured with launchOptions.slowMo so when executed with '--headed',
 * every interaction (navigation, keystroke, click, validation error, toast)
 * is clearly observable in a visible Chromium browser window.
 */
test.use({
  launchOptions: {
    // 400ms delay between actions for smooth, human-observable execution in headed mode
    slowMo: 400,
  },
});

test.describe('Add Doctor Workflow (Visible Chromium Suite)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('1. Form validation errors on empty submission and invalid email', async ({ page }) => {
    // Navigate to Doctors Directory
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();

    // Open Add Doctor modal
    await page.getByTestId('btn-add-doctor').click();
    const dialog = page.getByRole('dialog', { name: 'Add Doctor' });
    await expect(dialog).toBeVisible();

    // Submit empty form to trigger Zod client validation
    await page.getByTestId('btn-submit-doctor').click();

    // Verify all field-level validation messages appear
    await expect(page.getByText('Doctor name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Specialty is required')).toBeVisible();
    await expect(page.getByText(/Hospital is required/i)).toBeVisible();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page.getByText('Valid phone number is required')).toBeVisible();

    // Test invalid email format error
    const emailInput = page.getByPlaceholder(/name@hospital\.com|alex\.mercer@hospital\.org/i);
    await emailInput.fill('not-an-email');
    await page.getByTestId('btn-submit-doctor').click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();

    // Verify dialog remains open
    await expect(dialog).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('2. Modal cancelation and dismissal preserves directory state', async ({ page }) => {
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();

    // Open Add Doctor modal
    await page.getByTestId('btn-add-doctor').click();
    const dialog = page.getByRole('dialog', { name: 'Add Doctor' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/doctors\/new$/);

    // Partially fill form fields
    const testGhostName = `Dr. Ghost ${Date.now()}`;
    await page.getByPlaceholder(/Dr\. Full name|e\.g\. Dr\. Alex Mercer/i).fill(testGhostName);
    await page.getByPlaceholder(/Choose or type|e\.g\. Cardiology/i).first().fill('Radiology');

    // Dismiss using the Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Verify modal is dismissed and URL returns to /doctors
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/doctors$/);

    // Ensure the canceled doctor was never added to the table
    await expect(page.getByTestId('doctors-table-body')).not.toContainText(testGhostName);
  });

  test('3. Happy path: Add doctor via intercepted modal, verify table and dashboard count', async ({ page }) => {
    // Step 1: Record initial total doctor count from Dashboard KPI
    await page.goto('/dashboard');
    const kpiLocator = page.getByTestId('kpi-total-doctors');
    await expect(kpiLocator).toBeVisible();
    const initialCount = parseInt(await kpiLocator.innerText(), 10);

    // Step 2: Navigate to Doctors Directory
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();

    // Step 3: Click Add Doctor button (soft navigation opens @modal over background)
    await page.getByTestId('btn-add-doctor').click();
    const dialog = page.getByRole('dialog', { name: 'Add Doctor' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/doctors\/new$/);

    // Ensure background table remains mounted behind the modal
    await expect(page.getByTestId('doctors-table-body')).toBeVisible();

    // Step 4: Fill form with unique timestamped doctor details
    const uniqueSuffix = Date.now().toString().slice(-5);
    const doctorName = `Dr. Evelyn Reed ${uniqueSuffix}`;
    const doctorEmail = `dr.reed.${uniqueSuffix}@hospital.org`;
    const doctorSpecialty = 'Cardiology';
    const doctorHospital = 'Evercare Hospital Dhaka';
    const doctorPhone = '+1-555-0144';

    await page.getByPlaceholder(/Dr\. Full name|e\.g\. Dr\. Alex Mercer/i).fill(doctorName);
    await page.getByPlaceholder(/Choose or type|e\.g\. Cardiology/i).first().fill(doctorSpecialty);
    await page.getByTestId('input-doctor-hospital').fill(doctorHospital);
    await page.getByPlaceholder(/name@hospital\.com|alex\.mercer@hospital\.org/i).fill(doctorEmail);
    await page.getByPlaceholder(/\+880 1XXX-XXXXXX|\+1-555-0199/i).fill(doctorPhone);

    // Step 5: Submit form
    await page.getByTestId('btn-submit-doctor').click();

    // Step 6: Verify modal closes & toast notification confirms creation
    await expect(dialog).not.toBeVisible();
    const toast = page.getByRole('status');
    await expect(toast).toContainText(doctorName);

    // Step 7: Verify newly added doctor is visible in the directory table
    const tableBody = page.getByTestId('doctors-table-body');
    const doctorRow = tableBody.locator('tr', { hasText: doctorName });
    await expect(doctorRow).toBeVisible();
    await expect(doctorRow).toContainText(doctorSpecialty);

    // Step 8: Return to Dashboard and verify total doctors KPI incremented
    await page.goto('/dashboard');
    await expect(page.getByTestId('kpi-total-doctors')).toHaveText(String(initialCount + 1));
  });

  test('4. Standalone canonical page: Direct visit to /doctors/new and successful creation', async ({ page }) => {
    // Step 1: Direct navigation to canonical /doctors/new
    await page.goto('/doctors/new');

    // Standalone page shows dedicated header and back link, background directory is NOT present
    await expect(page.getByRole('heading', { name: 'Add New Doctor' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Doctors/i })).toBeVisible();
    await expect(page.getByTestId('doctors-table-body')).not.toBeVisible();

    // Step 2: Fill form on canonical page
    const uniqueSuffix = Date.now().toString().slice(-5);
    const doctorName = `Dr. Marcus Brody ${uniqueSuffix}`;
    const doctorEmail = `dr.brody.${uniqueSuffix}@hospital.org`;
    const doctorSpecialty = 'Neurology';
    const doctorHospital = 'United Hospital';
    const doctorPhone = '+1-555-0188';

    await page.getByPlaceholder(/Dr\. Full name|e\.g\. Dr\. Alex Mercer/i).fill(doctorName);
    await page.getByPlaceholder(/Choose or type|e\.g\. Cardiology/i).first().fill(doctorSpecialty);
    await page.getByTestId('input-doctor-hospital').fill(doctorHospital);
    await page.getByPlaceholder(/name@hospital\.com|alex\.mercer@hospital\.org/i).fill(doctorEmail);
    await page.getByPlaceholder(/\+880 1XXX-XXXXXX|\+1-555-0199/i).fill(doctorPhone);

    // Step 3: Submit doctor form
    await page.getByTestId('btn-submit-doctor').click();

    // Step 4: Standalone page redirects back to /doctors
    await page.waitForURL('**/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();

    // Step 5: Verify newly created doctor appears in directory table
    const tableBody = page.getByTestId('doctors-table-body');
    const doctorRow = tableBody.locator('tr', { hasText: doctorName });
    await expect(doctorRow).toBeVisible();
    await expect(doctorRow).toContainText(doctorSpecialty);
  });

  test('5. Hospital combobox supports dynamic search and inline "+ Add new hospital"', async ({ page }) => {
    await page.goto('/doctors/new');
    const hospitalInput = page.getByTestId('input-doctor-hospital');
    await expect(hospitalInput).toBeVisible();

    // Type query to filter
    await hospitalInput.fill('Square');
    const listbox = page.getByTestId('hospital-combobox-list');
    await expect(listbox).toBeVisible();
    await expect(listbox.getByText('Square Hospital')).toBeVisible();

    // Type a brand new hospital name
    const newHospitalName = `St. Hope Hospital ${Date.now().toString().slice(-4)}`;
    await hospitalInput.fill(newHospitalName);
    const addNewOption = page.getByTestId('hospital-option-add-new');
    await expect(addNewOption).toBeVisible();
    await expect(addNewOption).toContainText(newHospitalName);

    // Click "+ Add"
    await addNewOption.click();

    // Combobox closes and input has the new hospital name
    await expect(listbox).not.toBeVisible();
    await expect(hospitalInput).toHaveValue(newHospitalName);
  });

  test('6. Specialization combobox supports dynamic search and inline "+ Add new specialization"', async ({ page }) => {
    await page.goto('/doctors/new');
    const specInput = page.getByTestId('input-doctor-specialization');
    await expect(specInput).toBeVisible();

    // Type query to filter
    await specInput.fill('Cardio');
    const listbox = page.getByTestId('specialization-combobox-list');
    await expect(listbox).toBeVisible();
    await expect(listbox.getByText('Cardiology')).toBeVisible();

    // Type a brand new specialization name
    const newSpecName = `Pediatric Neuro-Oncology ${Date.now().toString().slice(-4)}`;
    await specInput.fill(newSpecName);
    const addNewOption = page.getByTestId('specialization-option-add-new');
    await expect(addNewOption).toBeVisible();
    await expect(addNewOption).toContainText(newSpecName);

    // Click "+ Add"
    await addNewOption.click();

    // Combobox closes and input has the new specialization name
    await expect(listbox).not.toBeVisible();
    await expect(specInput).toHaveValue(newSpecName);
  });
});
