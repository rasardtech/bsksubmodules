# -*- coding: utf-8 -*-

{
    'name': "Hide Decimal Zero Value",

    'summary': """
        Hide decimal zero value in float and monetary fields in Odoo views and PDF Reports.
        """,
    'description': """
Hide Decimal Zero value
Remove Decimal Zero Trailing
odoo Decimal Precision
Decimal Precision
remove Decimal zeros
Decimal Precision drop zeros
Hide Decimal Zero Trailing
All item last one zero remove
extra descpripn
    """,
    'license': 'OPL-1',
    'category': 'Extra Tools',
    'author': 'Waleed Mohsen',
    'support': 'mohsen.waleed@gmail.com',
    'currency': 'USD',
    'price': 29.0,
    'version': '1.0.2',
    'depends': ['base','account'],
    'assets': {
        'web.assets_backend': [
            'wm_remove_decimal_zero_value/static/src/js/formatters.js',
        ],
    },
    'images': ['static/description/main_screenshot.png'],
    
    "installable": True
}
