from odoo import api, SUPERUSER_ID

def post_init_hook(env):
    
    monetary_names = ['Product Price', 'Payroll']
    
    precisions = env['decimal.precision'].search([('name', 'in', monetary_names)])
    precisions.write({'format_type': 'monetary'})
    
    pass
