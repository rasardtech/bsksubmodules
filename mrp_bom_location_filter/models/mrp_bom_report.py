from odoo import models, api

class ReportBomStructure(models.AbstractModel):
    _inherit = 'report.mrp.report_bom_structure'

    @api.model
    def get_html(self, bom_id=False, searchQty=1, searchVariant=False):
        current_context = self.env.context
        location_id = current_context.get('bom_location_id')
        
        if location_id:
            self = self.with_context(location=location_id)
            
        return super(ReportBomStructure, self).get_html(bom_id, searchQty, searchVariant)