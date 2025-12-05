from odoo import models, fields

class DecimalPrecision(models.Model):
    _inherit = 'decimal.precision'

    format_type = fields.Selection([
        ('quantitative', 'Quantitative'),
        ('monetary', 'Monetary'),
    ], string='Format Type', default='quantitative', required=True,
    help="Quantitative: Strip all trailing zeros.\nMonetary: Strip trailing zeros but keep minimum 2 decimals.")
