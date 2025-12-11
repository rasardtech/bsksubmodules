{
    'name': 'Simplified Decimal Display',
    'version': '17.0.1.0.1',
    'category': 'Productivity',
    'summary': 'Customize decimal precision formatting for quantitative and monetary fields.',
    'description': """
        This module splits decimal precision usage into two types:
        1. Quantitative: Strips all trailing zeros.
        2. Monetary: Strips trailing zeros but maintains a minimum of 2 decimals.
        Compatible with both dot and comma decimal separators.
    """,
    'author': 'Burak Şipşak',
    'website': 'https://apps.odoo.com/apps/browse?repo_maintainer_id=1059354',
    'depends': ['web', 'base'],
    'data': [
        'views/decimal_precision_views.xml',
    ],
    'images': ['images/main_screenshot.png'],
    'assets': {
        'web.assets_backend': [
            'simplified_decimal_display/static/src/js/formatters_patch.js',
        ],
    },
    'post_init_hook': 'post_init_hook',
    'license': 'OPL-1',
    'price': 14.75,
    'currency': 'EUR',
    'installable': True,
}
