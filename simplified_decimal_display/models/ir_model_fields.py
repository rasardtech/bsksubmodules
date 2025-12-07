from odoo import models, fields, api

class IrModelFields(models.Model):
    _inherit = 'ir.model.fields'
    
    pass

from odoo.fields import Float

original_get_description = Float.get_description

def get_description(self, env, attributes=None):
    desc = original_get_description(self, env, attributes=attributes)
    digits = getattr(self, 'digits', None) or getattr(self, '_digits', None)
    
    if digits and isinstance(digits, str):
        precision_name = digits
        
        try:
            dp = env['decimal.precision'].search([('name', '=', precision_name)], limit=1)
            if dp:
                format_type = dp.format_type
                numeric_digits = (16, dp.digits)
                
                desc['digits'] = (numeric_digits[0], numeric_digits[1], format_type)
                desc['format_type'] = format_type
            else:
                desc['digits'] = (16, 2, 'quantitative')
                desc['format_type'] = 'quantitative'
        except Exception:
            desc['digits'] = (16, 2, 'quantitative')
            desc['format_type'] = 'quantitative'
            
    return desc

Float.get_description = get_description
