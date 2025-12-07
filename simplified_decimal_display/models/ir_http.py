from odoo import models

class Http(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        result = super(Http, self).session_info()
        precisions = self.env['decimal.precision'].search_read([], ['name', 'format_type'])
        precision_map = {rec['name']: rec['format_type'] for rec in precisions}
        
        result['decimal_precision_config'] = precision_map
        return result
