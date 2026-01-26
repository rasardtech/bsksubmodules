{
    'name': 'Product Template Redirect',
    'version': '17.0.1.0.0',
    'category': 'Productivity',
    'summary': 'Redirect Product Variant links to Product Template',
    'description': """
Product Template Redirect
=========================

This module enhances the user experience by automatically redirecting Product Variant links to their respective Product Templates.

Key Features
============

* **Automatic Redirection**: When a user clicks on a many2one link pointing to a `product.product`, the module intercepts the action and opens the corresponding `product.template` form.
* **Streamlined Workflow**: Reduces the number of clicks required to reach the main product configuration page.
* **Compatibility**: Patches the standard Many2one field component in the web client, ensuring broad coverage across the backend.
    """,
    'author': 'Burak Şipşak',
    'license': 'LGPL-3',
    'depends': ['web', 'product'],
    'images': ['images/main_screenshot.png'],
    'data': [],
    'assets': {
        'web.assets_backend': [
            'product_template_redirect/static/src/js/redirect_patch.js',
        ],
    },
    'installable': True,
    'application': False,
}