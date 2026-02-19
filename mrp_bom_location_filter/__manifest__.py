{
    'name': 'BoM Overview Location Filter',
    'version': '17.0.1.0.0',
    'category': 'Manufacturing',
    'summary': 'Adds location-based filtering to the BoM Overview screen.',
    'author': 'Burak Şipşak',
    'depends': ['mrp', 'stock'],
    'data': [],
    'assets': {
        'web.assets_backend': [
            'mrp_bom_location_filter/static/src/js/mrp_bom_overview_listener.js',
            'mrp_bom_location_filter/static/src/js/mrp_bom_report_filter.js',
            'mrp_bom_location_filter/static/src/xml/mrp_bom_report_filter.xml',
        ],
    },
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}