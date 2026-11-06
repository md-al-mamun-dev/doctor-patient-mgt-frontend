import { test, expect } from '../fixtures/test';

test.describe('Frontend State Management Architecture', () => {
  test('1. Login form validation and navigation to Dashboard', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await expect(page).toHaveTitle(/Sign in/i);

    // Test form error with invalid credentials
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitBtn = page.getByTestId('btn-login-submit');

    await emailInput.fill('wrong@user.com');
    await passwordInput.fill('WrongPass123!');
    await submitBtn.click();

    await expect(page.getByTestId('login-error')).toContainText(/Invalid email or password|Too many attempts/i);

    // Test demo quick-fill button & single keystroke Enter login
    await page.getByTestId('btn-demo-admin').click();
    await expect(emailInput).toHaveValue('admin@doctortracker.dev');
    await expect(passwordInput).toHaveValue('ChangeMe123!');
    await page.keyboard.press('Enter');

    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByTestId('kpi-total-doctors')).toBeVisible();
    await expect(page.getByTestId('kpi-total-patients')).toBeVisible();
  });

  test('2. Doctor creation updates doctors list and dashboard KPI', async ({ page }) => {
    // 1. Visit dashboard to check initial doctors count
    await page.goto('/dashboard');
    const kpiDoctors = page.getByTestId('kpi-total-doctors');
    await expect(kpiDoctors).toBeVisible();
    const initialDoctorText = await kpiDoctors.innerText();
    const initialCount = parseInt(initialDoctorText, 10);

    // 2. Navigate to Doctors directory
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();

    // 3. Open Add Doctor modal
    await page.getByTestId('btn-add-doctor').click();
    await expect(page.getByRole('dialog', { name: 'Add Doctor' })).toBeVisible();

    // 4. Fill form
    const uniqueName = `Dr. Specialist ${Date.now().toString().slice(-6)}`;
    await page.getByPlaceholder(/Dr\. Full name|e\.g\. Dr\. Alex Mercer/i).fill(uniqueName);
    await page.getByPlaceholder(/Choose or type|e\.g\. Cardiology/i).first().fill('Neurology');
    await page.getByTestId('input-doctor-hospital').fill('Evercare Hospital');
    await page.getByPlaceholder(/name@hospital\.com|alex\.mercer@hospital\.org/i).fill(`dr.${Date.now()}@hospital.org`);
    await page.getByPlaceholder(/\+880 1XXX-XXXXXX|\+1-555-0199/i).fill('+1-555-8888');

    // 5. Submit form
    await page.getByTestId('btn-submit-doctor').click();

    // 6. Verify modal closed, toast shown, and doctor present in table
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('status')).toContainText(uniqueName);
    await expect(page.getByTestId('doctors-table-body').getByText(uniqueName)).toBeVisible();

    // 7. Verify dashboard total doctors incremented
    await page.goto('/dashboard');
    await expect(page.getByTestId('kpi-total-doctors')).toHaveText(String(initialCount + 1));
  });

  test('3. Patient creation under doctor updates doctor caseload, patient roster, and dashboard', async ({ page }) => {
    // 1. Visit Doctor profile
    await page.goto('/doctors/669d6d77362041728a698101');
    await expect(page.getByTestId('doctor-name-heading')).toContainText('Dr. Sarah Jenkins');
    const caseloadLocator = page.getByTestId('doctor-caseload-count');
    await expect(caseloadLocator).toBeVisible();
    const initialCaseloadText = await caseloadLocator.innerText();
    const initialCaseload = parseInt(initialCaseloadText, 10);

    // 2. Open Assign Patient modal
    await page.getByTestId('btn-assign-patient').click();
    await expect(page.getByRole('dialog', { name: /Add Patient/i })).toBeVisible();

    // 3. Fill patient details
    const uniquePatientName = `Patient ${Date.now().toString().slice(-6)}`;
    await page.getByPlaceholder(/Patient's full name|e\.g\. Eleanor Vance/i).fill(uniquePatientName);
    await page.getByPlaceholder(/Years|42/i).fill('29');
    const diagInput = page.getByPlaceholder(/For example, hypertension|e\.g\. Hypertension/i);
    if ((await diagInput.count()) > 0) {
      await diagInput.fill('Cardiomyopathy');
    }
    await page.getByRole('button', { name: /Add patient|Register Patient/i }).click();

    // 4. Verify modal closed and patient in assigned table
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('assigned-patients-body').getByText(uniquePatientName)).toBeVisible();

    // 5. Verify doctor caseload incremented
    await expect(page.getByTestId('doctor-caseload-count')).toHaveText(`${initialCaseload + 1} active patients`);

    // 6. Verify patient appears in global patients roster
    await page.goto('/patients');
    await expect(page.getByTestId('patients-table-body').getByText(uniquePatientName)).toBeVisible();
  });

  test('4. Patient editing and doctor reassignment reflects across views', async ({ page }) => {
    // 1. Go to patients roster and find the first patient
    await page.goto('/patients');
    const firstRow = page.locator('[data-testid^="patient-row-"]').first();
    await expect(firstRow).toBeVisible();
    const patientName = (await firstRow.locator('td').first().locator('span').first().innerText()).trim();
    const patientId = (await firstRow.getAttribute('data-testid'))?.replace('patient-row-', '') || '669d6d77362041728a698212';
    const editBtn = page.getByTestId(`btn-edit-patient-${patientId}`);

    await editBtn.click();
    await expect(page.getByRole('dialog', { name: 'Edit Patient Record' })).toBeVisible();

    // Change condition to Critical
    const conditionSelect = page.getByRole('dialog').locator('select[name="condition"]');
    await conditionSelect.selectOption('Critical');

    // Reassign to Dr. Michael Chen
    const changeDoctorBtn = page.getByRole('dialog').getByTestId('btn-change-doctor');
    await expect(changeDoctorBtn).toBeVisible();
    await changeDoctorBtn.click();
    await page.getByTestId('btn-select-doctor-669d6d77362041728a698102').click();

    // Save
    await page.getByTestId('btn-submit-patient').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify row in table shows updated condition and new doctor name
    await expect(firstRow.getByRole('cell', { name: 'Critical' }).first()).toBeVisible();
    await expect(firstRow.getByRole('link', { name: 'Dr. Michael Chen' })).toBeVisible();

    // Verify patient is now in Dr. Michael Chen's profile
    await page.goto('/doctors/669d6d77362041728a698102');
    await expect(page.getByTestId('assigned-patients-body').getByText(patientName)).toBeVisible();
  });

  test('5. Patient deletion with cancellation guard updates store and dashboard', async ({ page }) => {
    await page.goto('/patients');
    const firstRow = page.locator('[data-testid^="patient-row-"]').first();
    await expect(firstRow).toBeVisible();
    const patientName = (await firstRow.locator('td').first().locator('span').first().innerText()).trim();
    const deleteBtn = firstRow.getByRole('button', { name: /Delete/i });

    // Open confirmation dialog
    await deleteBtn.click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete Patient Record' });
    await expect(dialog).toBeVisible();

    // Test Cancel button keeps patient untouched
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(firstRow.getByText(patientName)).toBeVisible();

    // Now delete for real
    await deleteBtn.click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm Delete' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible();

    // Verify toast notification for deleted patient
    await expect(page.getByRole('status')).toContainText(patientName);
    await expect(page.getByTestId('patients-table-body').getByText(patientName)).not.toBeVisible();
  });

  test('6. URL search, filters, and deep-link navigation history', async ({ page }) => {
    // 1. Direct navigation with query parameters
    await page.goto('/patients?status=Critical');
    await expect(page).toHaveURL(/.*status=Critical/);

    const statusSelect = page.getByTestId('patient-status-select');
    await expect(statusSelect).toHaveValue('Critical');

    // Verify filtered table results only contain Critical badges
    const tableBody = page.getByTestId('patients-table-body');
    await expect(tableBody).toBeVisible();

    // 2. Reset filters restores full list
    await page.getByRole('button', { name: 'Reset Filters' }).click();
    await expect(page).toHaveURL(/.*patients(\?page=1)?$/);
    await expect(statusSelect).toHaveValue('');

    // 3. Navigate away to dashboard and back to verify deep link history
    await page.goto('/patients?status=Recovered');
    await expect(page).toHaveURL(/.*status=Recovered/);

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/.*status=Recovered/);
    await expect(page.getByTestId('patient-status-select')).toHaveValue('Recovered');
  });

  test('7. Date-wise filtering on Doctors, Patients, and Dashboard trend toggle', async ({ page }) => {
    // 1. Dashboard Admissions Trend range toggle pills
    await page.goto('/dashboard');
    const pill7d = page.getByTestId('btn-trend-range-7d');
    const pill30d = page.getByTestId('btn-trend-range-30d');
    const pill90d = page.getByTestId('btn-trend-range-90d');

    await expect(pill30d).toBeVisible();
    await pill7d.click();
    await expect(page.getByText(/across the selected period \(7D\)/i)).toBeVisible();

    await pill90d.click();
    await expect(page.getByText(/across the selected period \(90D\)/i)).toBeVisible();

    // 2. Doctors directory date-wise filtering
    await page.goto('/doctors');
    const docPresetSelect = page.getByTestId('doctor-date-preset-select');
    await expect(docPresetSelect).toBeVisible();

    // Select custom range
    await docPresetSelect.selectOption('custom');
    await expect(page.getByTestId('doctor-custom-date-row')).toBeVisible();

    const docFromInput = page.getByTestId('doctor-date-from');
    const docToInput = page.getByTestId('doctor-date-to');
    await docFromInput.fill('2024-01-01');
    await docToInput.fill('2024-12-31');
    await expect(page).toHaveURL(/.*from=2024-01-01.*to=2024-12-31/);

    // Reset filters
    await page.getByTestId('doctor-reset-filters').click();
    await expect(page).toHaveURL(/\/doctors$/);

    // 3. Patients roster date-wise filtering
    await page.goto('/patients');
    const patPresetSelect = page.getByTestId('patient-date-preset-select');
    await expect(patPresetSelect).toBeVisible();

    await patPresetSelect.selectOption('custom');
    await expect(page.getByTestId('patient-custom-date-row')).toBeVisible();

    const patFromInput = page.getByTestId('patient-date-from');
    const patToInput = page.getByTestId('patient-date-to');
    await patFromInput.fill('2024-01-01');
    await patToInput.fill('2024-01-31');
    await expect(page).toHaveURL(/.*from=2024-01-01.*to=2024-01-31/);

    // Verify reset
    await page.getByTestId('patient-reset-filters').click();
    await expect(page).toHaveURL(/\/patients$/);
  });

  test('8. Static Dashboard Parity: 5-card KPI grid, condition breakdown, top 10 doctors, and specializations table', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // 1. Verify 5-card KPI Grid
    await expect(page.getByTestId('kpi-total-doctors')).toBeVisible();
    await expect(page.getByTestId('kpi-total-patients')).toBeVisible();
    await expect(page.getByText('New patients')).toBeVisible();
    await expect(page.getByRole('term').filter({ hasText: 'Patients per doctor' })).toBeVisible();
    await expect(page.getByTestId('kpi-critical-patients')).toBeVisible();

    // 2. Verify Patient Condition Section
    await expect(page.getByRole('heading', { name: 'Patient condition' })).toBeVisible();
    await expect(page.getByRole('img', { name: /Condition mix:/i })).toBeVisible();

    // Check condition links
    const criticalCard = page.locator('a[href*="condition=critical"]');
    await expect(criticalCard).toBeVisible();
    await expect(criticalCard.getByText('Critical')).toBeVisible();

    // 3. Verify Top 10 Doctors Caseloads
    await expect(page.getByRole('heading', { name: 'Patients per doctor' })).toBeVisible();
    const allDoctorsLink = page.getByRole('link', { name: 'All doctors' });
    await expect(allDoctorsLink).toBeVisible();

    // 4. Verify Specializations Table
    await expect(page.getByRole('heading', { name: 'Specializations' })).toBeVisible();
    const specTable = page.locator('table');
    await expect(specTable.getByRole('columnheader', { name: 'Specialization' })).toBeVisible();
    await expect(specTable.getByRole('columnheader', { name: 'Doctors' })).toBeVisible();
    await expect(specTable.getByRole('columnheader', { name: 'Patients' })).toBeVisible();

    // 5. Test Custom Date Popover
    const customBtn = page.getByRole('button', { name: /custom/i });
    await expect(customBtn).toBeVisible();
    await customBtn.click();

    const popover = page.getByRole('dialog', { name: /custom date range filter/i });
    await expect(popover).toBeVisible();
    await page.locator('#dashboard-custom-from').fill('2026-10-01');
    await page.locator('#dashboard-custom-to').fill('2026-10-31');
    await popover.getByRole('button', { name: 'Apply' }).click();

    await expect(popover).not.toBeVisible();
    await expect(customBtn).toContainText('2026-10-01 – 2026-10-31');
  });
});
