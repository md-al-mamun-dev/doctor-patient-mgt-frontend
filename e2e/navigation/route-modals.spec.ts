import { test, expect } from '../fixtures/test';

test.describe('Next.js Parallel & Intercepting Route Modals (Rule 8)', () => {
  test.describe('Workflow 1: Add Doctor (/doctors/new)', () => {
    test('Soft navigation intercepts into @modal over background view, URL updates', async ({ page }) => {
      await page.goto('/doctors');
      await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();

      // Soft navigation via client Link
      await page.getByTestId('btn-add-doctor').click();

      // Modal dialog is displayed over background
      await expect(page.getByRole('dialog', { name: 'Add Doctor' })).toBeVisible();
      await expect(page).toHaveURL(/\/doctors\/new$/);

      // Background list is still present
      await expect(page.getByTestId('doctors-table-body')).toBeVisible();

      // Back navigation closes modal
      await page.goBack();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page).toHaveURL(/\/doctors$/);

      // Forward navigation re-opens modal
      await page.goForward();
      await expect(page.getByRole('dialog', { name: 'Add Doctor' })).toBeVisible();
      await expect(page).toHaveURL(/\/doctors\/new$/);

      // Close via escape / close button
      await page.getByRole('button', { name: 'Close dialog' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('Direct URL visit and hard refresh render standalone canonical page', async ({ page }) => {
      // Direct navigation
      await page.goto('/doctors/new');
      await expect(page.getByRole('heading', { name: 'Add New Doctor' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to Doctors/i })).toBeVisible();

      // Background directory should not be present in canonical full page
      await expect(page.getByTestId('doctors-table-body')).not.toBeVisible();

      // Full reload maintains canonical page
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Add New Doctor' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save Doctor' })).toBeVisible();

      // Cancel button redirects to doctors directory
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL(/\/doctors$/);
    });

    test('Navigating to another portal route clears @modal slot', async ({ page }) => {
      await page.goto('/doctors');
      await page.getByTestId('btn-add-doctor').click();
      await expect(page.getByRole('dialog', { name: 'Add Doctor' })).toBeVisible();

      // Navigating to another portal route clears modal slot
      await page.goto('/patients');
      await expect(page).toHaveURL(/\/patients$/);
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Workflow 2: Add Patient (/doctors/[doctorId]/patients/new)', () => {
    test('Soft navigation intercepts into @modal from doctor detail view', async ({ page }) => {
      await page.goto('/doctors/669d6d77362041728a698101');
      await expect(page.getByTestId('doctor-name-heading')).toContainText('Dr. Sarah Jenkins');

      // Click assign patient
      await page.getByTestId('btn-assign-patient').click();
      await expect(page.getByRole('dialog', { name: /Add Patient/i })).toBeVisible();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101\/patients\/new$/);

      // Doctor header background is still visible behind modal
      await expect(page.getByTestId('doctor-name-heading')).toBeVisible();

      // Back navigation closes modal
      await page.goBack();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101$/);
    });

    test('Direct visit to doctor add patient renders standalone canonical page', async ({ page }) => {
      await page.goto('/doctors/669d6d77362041728a698101/patients/new');
      await expect(page.getByRole('heading', { name: /Add Patient/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to Doctor Profile/i })).toBeVisible();

      // Refresh renders standalone page
      await page.reload();
      await expect(page.getByRole('heading', { name: /Add Patient/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Add Patient/i })).toBeVisible();

      // Cancel returns to doctor profile
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101$/);
    });

    test('Doctor selection modal opens from Add Patient form, filters doctors, paginates, and updates selected doctor', async ({ page }) => {
      await page.goto('/doctors/669d6d77362041728a698101');
      await page.getByTestId('btn-assign-patient').click();
      const addPatientDialog = page.getByRole('dialog', { name: /Add Patient/i });
      await expect(addPatientDialog).toBeVisible();

      // Verify initial doctor banner matches Dr. Sarah Jenkins
      await expect(addPatientDialog.getByText('Dr. Sarah Jenkins').first()).toBeVisible();
      const changeBtn = page.getByTestId('btn-change-doctor');
      await expect(changeBtn).toBeVisible();

      // Open Doctor Selection modal
      await changeBtn.click();
      const pickerModal = page.getByTestId('modal-doctor-picker');
      await expect(pickerModal).toBeVisible();
      await expect(pickerModal.getByRole('heading', { name: /Select Doctor/i })).toBeVisible();

      // Verify search input filters doctors list
      const searchInput = page.getByTestId('input-doctor-search');
      await searchInput.fill('United');
      await expect(pickerModal.getByText(/United Hospital/i).first()).toBeVisible();

      // Clear search
      await searchInput.fill('');

      // Test pagination (5 per page)
      const nextBtn = page.getByTestId('btn-doctor-picker-next');
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();
        await expect(pickerModal.getByText(/Showing 6 to/i)).toBeVisible();
        const prevBtn = page.getByTestId('btn-doctor-picker-prev');
        await prevBtn.click();
        await expect(pickerModal.getByText(/Showing 1 to 5/i)).toBeVisible();
      }

      // Search for specific doctor: Michael Chen
      await searchInput.fill('Michael Chen');
      await expect(pickerModal.getByText('Dr. Michael Chen')).toBeVisible();

      // Select Dr. Michael Chen
      await page.getByTestId('btn-select-doctor-669d6d77362041728a698102').click();

      // Doctor picker modal should close
      await expect(pickerModal).not.toBeVisible();

      // Add patient modal remains open and banner now displays Dr. Michael Chen
      await expect(addPatientDialog).toBeVisible();
      await expect(addPatientDialog.getByText('Dr. Michael Chen').first()).toBeVisible();
    });

    test('General Add Patient (/patients/new) starts with no preselected doctor and auto-opens picker on submit', async ({ page }) => {
      await page.goto('/patients/new');
      await expect(page.getByText('No doctor assigned')).toBeVisible();
      await expect(page.getByTestId('btn-select-doctor')).toBeVisible();

      // Attempting to submit without doctor auto-opens doctor modal
      await page.getByTestId('btn-submit-patient').click();
      const pickerModal = page.getByTestId('modal-doctor-picker');
      await expect(pickerModal).toBeVisible();

      // Dismiss picker to verify inline validation error appears
      await page.keyboard.press('Escape');
      await expect(pickerModal).not.toBeVisible();
      await expect(page.getByText(/Please select an assigned doctor/i)).toBeVisible();
    });
  });

  test.describe('Workflow 3: Edit Patient (/patients/[patientId]/edit)', () => {
    test('Soft navigation from patient table opens edit modal over roster', async ({ page }) => {
      await page.goto('/patients');
      const firstRow = page.locator('[data-testid^="patient-row-"]').first();
      await expect(firstRow).toBeVisible();
      const patientId = (await firstRow.getAttribute('data-testid'))?.replace('patient-row-', '') || 'pat-12';

      // Click Edit link for this patient
      await page.getByTestId(`btn-edit-patient-${patientId}`).click();
      await expect(page.getByRole('dialog', { name: 'Edit Patient Record' })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/patients/${patientId}/edit$`));

      // Background roster remains visible
      await expect(page.getByTestId(`patient-row-${patientId}`)).toBeVisible();

      // Back navigation closes modal
      await page.goBack();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page).toHaveURL(/\/patients$/);
    });

    test('Direct URL visit renders standalone canonical edit page', async ({ page }) => {
      await page.goto('/patients/pat-1/edit');
      await expect(page.getByRole('heading', { name: 'Edit Patient Record' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to Patients/i })).toBeVisible();

      // Verify form is populated with patient details
      const nameInput = page.locator('input[name="name"]');
      await expect(nameInput).toHaveValue('John Doe');

      // Refresh preserves canonical edit page
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Edit Patient Record' })).toBeVisible();

      // Cancel returns to patients
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL(/\/patients$/);
    });

    test('Invalid patient ID renders graceful not-found recovery', async ({ page }) => {
      await page.goto('/patients/non-existent-pat-999/edit');
      await expect(page.getByRole('heading', { name: 'Patient Not Found' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Return to Patients' })).toBeVisible();
    });
  });

  test.describe('Workflow 4: Edit Doctor (/doctors/[doctorId]/edit)', () => {
    test('Soft navigation from doctor detail view intercepts into right-side drawer (@modal)', async ({ page }) => {
      await page.goto('/doctors/669d6d77362041728a698101');
      await expect(page.getByTestId('doctor-name-heading')).toContainText('Dr. Sarah Jenkins');

      // Click Edit doctor button
      await page.getByTestId('btn-edit-doctor').click();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101\/edit$/);

      // Drawer dialog appears on the right
      const drawer = page.getByTestId('edit-doctor-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('heading', { name: 'Edit doctor' })).toBeVisible();

      // Background doctor profile remains visible behind drawer
      await expect(page.getByTestId('doctor-name-heading')).toBeVisible();

      // Browser back closes drawer
      await page.goBack();
      await expect(drawer).not.toBeVisible();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101$/);

      // Browser forward re-opens drawer
      await page.goForward();
      await expect(drawer).toBeVisible();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101\/edit$/);

      // Close via close button
      await drawer.getByRole('button', { name: 'Close dialog' }).click();
      await expect(drawer).not.toBeVisible();
    });

    test('Editing doctor in drawer updates doctor details and reflects across UI', async ({ page }) => {
      await page.goto('/doctors/669d6d77362041728a698102');
      await expect(page.getByTestId('doctor-name-heading')).toContainText('Dr. Michael Chen');

      // Open drawer
      await page.getByTestId('btn-edit-doctor').click();
      const drawer = page.getByTestId('edit-doctor-drawer');
      await expect(drawer).toBeVisible();

      // Verify initial value
      const nameInput = drawer.locator('#d-name');
      await expect(nameInput).toHaveValue('Dr. Michael Chen');

      // Change name and submit
      await nameInput.fill('Dr. Michael Chen Updated');
      await drawer.getByTestId('btn-submit-doctor').click();

      // Drawer closes, header updates, and toast appears
      await expect(drawer).not.toBeVisible();
      await expect(page.getByTestId('doctor-name-heading')).toContainText('Dr. Michael Chen Updated');
      await expect(page.getByText(/Doctor Dr. Michael Chen Updated updated successfully/i)).toBeVisible();
    });

    test('Direct URL visit and reload render standalone canonical edit page', async ({ page }) => {
      await page.goto('/doctors/669d6d77362041728a698101/edit');
      await expect(page.getByRole('heading', { name: 'Edit Doctor Profile' })).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to Doctor Profile/i })).toBeVisible();

      // Form is populated with doctor data
      await expect(page.locator('#d-name')).toHaveValue(/Dr. Sarah Jenkins/);

      // Reload preserves canonical page
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Edit Doctor Profile' })).toBeVisible();

      // Cancel returns to doctor detail profile
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page).toHaveURL(/\/doctors\/669d6d77362041728a698101$/);
    });

    test('Invalid doctor ID renders graceful not-found recovery', async ({ page }) => {
      await page.goto('/doctors/non-existent-doc-999/edit');
      await expect(page.getByRole('heading', { name: 'Doctor Not Found' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Return to Doctors' })).toBeVisible();
    });
  });
});
