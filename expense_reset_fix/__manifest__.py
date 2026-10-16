{
    'name': 'Expense Reset Fix',
    'version': '19.0.4.0.0',
    'summary': 'Prevents reversal journal entries when resetting expense sheets and enables editing for company-paid expenses.',
    'description': """
Expense Reset Fix & Clean Journal Entries
=========================================

This module improves the standard Odoo Expense workflow by preventing the creation of unnecessary "Reversal" journal entries and allowing more flexibility for company-paid expenses.

Key Features
------------
1. Prevent Reversal Entries (Ledger Pollution):
   - In standard Odoo 19, an expense linked to a posted journal entry cannot be reset to draft.
   - With this module, resetting an expense deletes the *existing* Journal Entry (and the
     payments/counterpart entries reconciled with it) instead of reversing it.
   - When re-posted, a single new entry is created, keeping your General Ledger clean.

2. Edit "Company Paid" Expenses:
   - Company-paid expenses go to the "Paid" state immediately after posting.
   - This module allows resetting them with the same clean logic (the payment and its
     journal entry are deleted).

Note (19.0): expense sheets (hr.expense.sheet) no longer exist; the logic applies to
hr.expense. Draft entry cleanup on re-post / delete is handled by standard Odoo 19.
    """,
    'category': 'Accounting',
    'author': 'Burak Şipşak',
    'website': 'https://github.com/sipsak',
    'license': 'LGPL-3',
    'depends': ['hr_expense', 'account'],
    'images': ['images/main_screenshot.png'],
    'data': [],
    'installable': True,
    'auto_install': False,
    'application': False,
}