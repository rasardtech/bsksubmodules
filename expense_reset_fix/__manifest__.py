{
    'name': 'Expense Reset Fix',
    'version': '17.0.4.0.0',
    'summary': 'Prevents reversal journal entries when resetting expense sheets and enables editing for company-paid expenses.',
    'description': """
Expense Reset Fix & Clean Journal Entries
=========================================

This module improves the standard Odoo Expense workflow by preventing the creation of unnecessary "Reversal" journal entries and allowing more flexibility for company-paid expenses.

Key Features
------------
1. Prevent Reversal Entries (Ledger Pollution):
   - In standard Odoo, resetting a posted expense sheet to "Draft" creates a reversal journal entry. Re-posting it creates a third entry.
   - With this module, resetting an expense sheet deletes the *existing* Journal Entry.
   - When re-posted, the existing entry is updated, keeping your General Ledger clean with a single entry per expense report.

2. Edit "Company Paid" Expenses:
   - Standard Odoo locks expenses paid by the Company (Paid By: Company) to the "Done" state immediately after posting, disabling the "Reset to Draft" button.
   - This module enables the "Reset to Draft" button for company-paid expenses, allowing you to correct mistakes using the same clean logic (updating the existing journal entry) as above.

3. Auto-Cleanup:
   - If a draft expense sheet is deleted, the associated journal entry is automatically deleted.
    """,
    'category': 'Accounting',
    'author': 'Burak Şipşak',
    'website': 'https://github.com/sipsak',
    'license': 'LGPL-3',
    'depends': ['hr_expense', 'account'],
    'images': ['images/main_screenshot.png'],
    'data': [
        'views/hr_expense_sheet_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}