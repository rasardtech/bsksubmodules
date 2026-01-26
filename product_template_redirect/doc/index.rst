=========================
Product Template Redirect
=========================

This module enhances the user experience by automatically redirecting Product Variant links to their respective Product Templates.

Key Features
============

* **Automatic Redirection**: When a user clicks on a many2one link pointing to a `product.product`, the module intercepts the action and opens the corresponding `product.template` form.
* **Streamlined Workflow**: Reduces the number of clicks required to reach the main product configuration page.
* **Compatibility**: Patches the standard Many2one field component in the web client, ensuring broad coverage across the backend.

Usage
=====

1. Install the module.
2. Navigate to any record containing a many2one link to a Product (e.g., Sale Order Lines, Stock Moves).
3. Click on the internal link button (or product name).
4. You will be redirected to the product.template form instead of the product.product form.

Technical Details
=================

The module uses the OWL `patch` utility to modify the `Many2One` component's `openRecord` or `openAction` methods. It queries the `product_tmpl_id` from the selected variant and triggers a `doAction` to open the template form.
