{
    'name': 'Expense Reset Fix',
    'version': '17.0.1.0.0',
    'summary': 'When you save the expense form as a draft, the journal entry is also saved as a draft, when you delete the expense form, the journal entry is also deleted',
    'description': """
        In Odoo's default configuration, when you approve an expense form, a journal entry is created.
        When you convert the expense form to draft, the journal entry is not converted to draft; instead, a reverse entry is created.
        When you delete the expense form, these journal entries are not deleted either.
        With this module, when you convert the expense form to draft, instead of creating a reverse journal entry, the initially created journal entry is converted to draft, and when you delete the expense form, the journal entry is also deleted.
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
