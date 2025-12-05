{
    'name': 'Decimal Precision Customize',
    'version': '17.0.1.0.2',
    'category': 'Technical',
    'summary': 'Customize decimal precision formatting for quantitative and monetary fields.',
    'description': """
        This module splits decimal precision usage into two types:
        1. Quantitative: Strips all trailing zeros.
        2. Monetary: Strips trailing zeros but maintains a minimum of 2 decimals.
        Compatible with both dot and comma decimal separators.
    """,
    'author': 'Burak Şipşak',
    'depends': ['web', 'base'],
    'data': [
        'views/decimal_precision_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'bi_decimal_precision_customize/static/src/js/formatters_patch.js',
        ],
    },
    'post_init_hook': 'post_init_hook',
    'installable': True,
    'license': 'LGPL-3',
}
