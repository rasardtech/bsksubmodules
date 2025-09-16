# -*- coding: utf-8 -*-

from odoo import api, models,_,fields
from odoo.tools import  float_utils, pycompat
from decimal import Decimal, ROUND_DOWN, InvalidOperation
import re
from markupsafe import Markup
import logging

_logger = logging.getLogger(__name__)
class MonetaryConverter(models.AbstractModel):
    _inherit = 'ir.qweb.field.monetary'

    @api.model
    def value_to_html(self, value, options):
        display_currency = options['display_currency']

        if not isinstance(value, (int, float)):
            raise ValueError(_("The value send to monetary field is not a number."))

        # lang.format mandates a sprintf-style format. These formats are non-
        # minimal (they have a default fixed precision instead), and
        # lang.format will not set one by default. currency.round will not
        # provide one either. So we need to generate a precision value
        # (integer > 0) from the currency's rounding (a float generally < 1.0).
        fmt = "%.{0}f".format(options.get('decimal_places', display_currency.decimal_places))

        if options.get('from_currency'):
            date = options.get('date') or fields.Date.today()
            company_id = options.get('company_id')
            if company_id:
                company = self.env['res.company'].browse(company_id)
            else:
                company = self.env.company
            value = options['from_currency']._convert(value, display_currency, company, date)

        # Detect 9-run (five+ 9s) in fractional part and round up at the digit before the run
        def round_nine_run(num: Decimal) -> Decimal:
            sign, digits, exp = num.as_tuple()
            if exp >= 0:
                return num
            frac_len = -exp
            if frac_len <= 0:
                return num
            s = format(num, 'f')
            if '.' not in s:
                return num
            int_part, frac = s.split('.')
            m = re.search(r'9{5,}', frac)
            if not m:
                return num
            start = m.start()
            if start == 0:
                # 0.99999 -> 1
                try:
                    return (Decimal(int_part) + 1).quantize(Decimal('1'))
                except InvalidOperation:
                    return num
            keep = frac[:start]
            pivot = int(keep[-1])
            before = keep[:-1]
            pivot += 1
            carry = 0
            if pivot == 10:
                pivot = 0
                carry = 1
            # propagate carry in 'before'
            before_list = list(before)
            for i in range(len(before_list)-1, -1, -1):
                if carry == 0:
                    break
                d = int(before_list[i]) + carry
                if d >= 10:
                    before_list[i] = '0'
                    carry = 1
                else:
                    before_list[i] = str(d)
                    carry = 0
            new_int = int_part
            if carry == 1:
                try:
                    new_int = str(int(int_part) + 1)
                except Exception:
                    return num
            new_frac = ''.join(before_list) + str(pivot)
            new_str = new_int + '.' + new_frac if new_frac else new_int
            try:
                return Decimal(new_str)
            except InvalidOperation:
                return num

        # Truncate raw value to 7 decimals without rounding to avoid artifacts
        try:
            dec_value = Decimal(str(value))
        except InvalidOperation:
            dec_value = Decimal(0)
        dec_value = round_nine_run(dec_value)
        # Monetary special rule: if 9-run starts at or after 3rd fractional digit, round to 2 decimals
        s = format(dec_value, 'f')
        if '.' in s:
            ip, fp = s.split('.')
            m9 = re.search(r'9{5,}', fp)
            if m9 and m9.start() >= 2:
                try:
                    dec_value = (dec_value.quantize(Decimal('0.01')))
                except InvalidOperation:
                    pass
        dec_value = dec_value.quantize(Decimal('0.0000000'), rounding=ROUND_DOWN)

        lang = self.user_lang()
        # Round for currency display but preserve long non-zero decimals:
        # Build string ourselves: keep fraction up to 7, but ensure at least 2
        # First format with 7 decimals, then trim trailing zeros but keep >=2
        base_formatted = lang.format('%.7f', float(dec_value), grouping=True, monetary=True)
        base_formatted = base_formatted.replace(r' ', '\N{NO-BREAK SPACE}').replace(r'-','-\N{ZERO WIDTH NO-BREAK SPACE}')
        if lang.decimal_point in base_formatted:
            integer_part, decimal_part = base_formatted.split(lang.decimal_point)
            decimal_part = decimal_part.rstrip('0')
            if len(decimal_part) < 2:
                decimal_part = (decimal_part + '00')[:2]
            formatted_amount = integer_part + lang.decimal_point + decimal_part
        else:
            formatted_amount = base_formatted + lang.decimal_point + '00'

        pre = post = ''
        if display_currency.position == 'before':
            pre = '{symbol}\N{NO-BREAK SPACE}'.format(symbol=display_currency.symbol or '')
        else:
            post = '\N{NO-BREAK SPACE}{symbol}'.format(symbol=display_currency.symbol or '')

        if options.get('label_price') and lang.decimal_point in formatted_amount:
            sep = lang.decimal_point
            integer_part, decimal_part = formatted_amount.split(sep)
            integer_part += sep
            return Markup('{pre}<span class="oe_currency_value">{0}</span><span class="oe_currency_value" style="font-size:0.5em">{1}</span>{post}').format(integer_part, decimal_part, pre=pre, post=post)

        return Markup('{pre}<span class="oe_currency_value">{0}</span>{post}').format(formatted_amount, pre=pre, post=post)



class FloatConverter(models.AbstractModel):
    _inherit = 'ir.qweb.field.float'

    @api.model
    def value_to_html(self, value, options):
        if 'decimal_precision' in options:
            precision = self.env['decimal.precision'].precision_get(options['decimal_precision'])
        else:
            precision = options['precision']

        # Truncate raw to 7 decimals (no rounding) after rounding 9-run
        try:
            dec_value = Decimal(str(value))
        except InvalidOperation:
            dec_value = Decimal(0)
        # nine-run rounding
        def round_nine_run(num: Decimal) -> Decimal:
            sign, digits, exp = num.as_tuple()
            if exp >= 0:
                return num
            s = format(num, 'f')
            if '.' not in s:
                return num
            int_part, frac = s.split('.')
            m = re.search(r'9{5,}', frac)
            if not m:
                return num
            start = m.start()
            if start == 0:
                try:
                    return (Decimal(int_part) + 1).quantize(Decimal('1'))
                except InvalidOperation:
                    return num
            keep = frac[:start]
            pivot = int(keep[-1])
            before = keep[:-1]
            pivot += 1
            carry = 0
            if pivot == 10:
                pivot = 0
                carry = 1
            before_list = list(before)
            for i in range(len(before_list)-1, -1, -1):
                if carry == 0:
                    break
                d = int(before_list[i]) + carry
                if d >= 10:
                    before_list[i] = '0'
                    carry = 1
                else:
                    before_list[i] = str(d)
                    carry = 0
            new_int = int_part
            if carry == 1:
                try:
                    new_int = str(int(int_part) + 1)
                except Exception:
                    return num
            new_frac = ''.join(before_list) + str(pivot)
            new_str = new_int + '.' + new_frac if new_frac else new_int
            try:
                return Decimal(new_str)
            except InvalidOperation:
                return num
        dec_value = round_nine_run(dec_value)
        dec_value = dec_value.quantize(Decimal('0.0000000'), rounding=ROUND_DOWN)

        # Use up to 7 decimals for base formatting, then simplify trailing zeros
        fmt = '%.7f'
        lang = self.user_lang()
        formatted = self.user_lang().format(fmt, float(dec_value), grouping=True).replace(r'-', '-\N{ZERO WIDTH NO-BREAK SPACE}')

        # %f does not strip trailing zeroes. %g does but its precision causes
        # it to switch to scientific notation starting at a million *and* to
        # strip decimals. So use %f and if no precision was specified manually
        # strip trailing 0.
        if precision is None:
            formatted = re.sub(r'(?:(0|\d+?)0+)$', r'\1', formatted)

        # Only the below lines changed by this app.
        lang = self.user_lang()
        sep = lang.decimal_point
        if sep in formatted:
            integer_part, decimal_part = formatted.split(sep)
            # Non-monetary: always simplify (strip trailing zeros entirely)
            decimal_part = decimal_part.rstrip('0')
            if decimal_part:
                return pycompat.to_text(integer_part + sep + decimal_part)
            return pycompat.to_text(integer_part)
        return pycompat.to_text(formatted.rstrip('0').rstrip(lang.decimal_point))


