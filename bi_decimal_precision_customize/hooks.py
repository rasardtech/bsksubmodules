from odoo import api, SUPERUSER_ID

def post_init_hook(env):
    # This hook runs after module installation
    # We update existing decimal.precision records
    
    monetary_names = ['Product Price', 'Payroll']
    # All others default to 'quantitative', effectively handled by the default value in the model definition
    # or we can force them to 'quantitative' to be sure.
    
    # Update Monetary
    precisions = env['decimal.precision'].search([('name', 'in', monetary_names)])
    precisions.write({'format_type': 'monetary'})
    
    # Update Quantitative (all others)
    # We can fetch all and exclude monetary, or just leave them as they might have processed the default='quantitative' if they were created new (unlikely)
    # But for existing records, the column `format_type` will be populated with the SQL default or NULL.
    # If we set a default in Python, Odoo populates existing rows with that default on add column.
    # So we only need to change the ones that should be monetary.
    
    pass
