# -*- coding: utf-8 -*-

from odoo import api, models,_,fields
from odoo.tools import  float_utils, pycompat
import re
from markupsafe import Markup
import logging
from decimal import Decimal, ROUND_DOWN

_logger = logging.getLogger(__name__)
class MonetaryConverter(models.AbstractModel):
    _inherit = 'ir.qweb.field.monetary'

    @api.model
    def value_to_html(self, value, options):
        # Keep default Odoo behavior for monetary fields (no custom trimming)
        return super(MonetaryConverter, self).value_to_html(value, options)


class FloatConverter(models.AbstractModel):
    _inherit = 'ir.qweb.field.float'

    @api.model
    def value_to_html(self, value, options):
        if 'decimal_precision' in options:
            precision = self.env['decimal.precision'].precision_get(options['decimal_precision'])
        else:
            precision = options['precision']

        # Truncate raw value to 7 decimals without rounding
        try:
            d_value = Decimal(str(value))
            truncated_value = d_value.quantize(Decimal('0.0000001'), rounding=ROUND_DOWN)
        except Exception:
            truncated_value = Decimal(0)

        # Prepare format
        if precision is None:
            fmt = '%f'
            value_to_format = float(truncated_value)
        else:
            value_to_format = float_utils.float_round(float(truncated_value), precision_digits=precision)
            fmt = '%.{precision}f'.format(precision=precision)

        lang = self.user_lang()
        formatted = lang.format(fmt, value_to_format, grouping=True).replace(r'-', '-\N{ZERO WIDTH NO-BREAK SPACE}')

        # Always strip trailing zeros from the decimal part for non-monetary numbers
        sep = lang.decimal_point
        if sep in formatted:
            formatted = formatted.rstrip('0').rstrip(sep)

        return pycompat.to_text(formatted)


