from odoo import models, fields, api

class IrModelFields(models.Model):
    _inherit = 'ir.model.fields'

    # Note: Odoo Core 'Float' field does not automatically read extra metadata from decimal.precision.
    # The 'digits' attribute on a field is normally a tuple (precision, scale) or a string (name of decimal.precision).
    # When it is a string, the web client fetches precision.
    # We need to make sure the web client knows the *format_type* associated with that precision name.
    
    # However, 'odoo.fields.Float' description generation happens in `get_description`.
    # Since we can't easily inherit `odoo.fields.Float`, we might need to rely on the fact that
    # the web client often gets field info schema.
    
    # Actually, a better approach for the web client to know the format type is:
    # The `decimal.precision` values are usually loaded or cached. 
    # BUT, the standard `formatFloat` function in JS usually just takes `digits`.
    # We need to somehow pass the `format_type` to the JS formatter.
    
    # In Odoo 17, `session` info or a separate call might be best.
    # But patching `Field` description is more direct if we can.
    # Let's try to patch `base` model's `fields_get` or similar? No, that's too heavy.
    
    # Wait, `decimal.precision` is cached in the registry or fetched. 
    # Let's check how Odoo 17 handles this.
    # Usually `digits` is just a pair of numbers.
    # If we look at how `FieldFloat` works, it uses `formatFloat`.
    
    # Let's patch `decimal.precision` directly to be available, 
    # AND patch `ir.model.fields` isn't strictly necessary if we load this config in JS.
    # But to make it cleaner, let's just ensure we have the data.
    
    # Actually, the implementation plan said: "Monkey patch odoo.fields.Float.get_description".
    # This is slightly risky but effective. Let's do it carefully.

    pass

# We will apply the monkey patch at the module level (top of file or via a hook).
# But doing it in a model file that is imported is standard for Odoo patches.

from odoo.fields import Float

original_get_description = Float.get_description

def get_description(self, env, attributes=None):
    desc = original_get_description(self, env, attributes=attributes)
    # Check for digits or _digits (internal storage)
    digits = getattr(self, 'digits', None) or getattr(self, '_digits', None)
    if digits and isinstance(digits, str):
        # digits is the name of the decimal.precision record
        precision_name = digits
        # We need to fetch the format_type. 
        # CAUTION: This creates a DB lookup for every field description generation!
        # Optimally this should be cached. `decimal.precision` has a cache.
        
        # Odoo's `decimal.precision` model has a `precision_get` method which is cached.
        # We should probably add a method `format_type_get` that is also cached.
        
        # But here we are inside a field object, `env` is available.
        try:
             # We use a safe lookup
            precision = env['decimal.precision'].search([('name', '=', precision_name)], limit=1)
            if precision:
                desc['format_type'] = precision.format_type
            else:
                desc['format_type'] = 'quantitative' # default
        except Exception:
             # Fallback if DB is not ready or other issues
            desc['format_type'] = 'quantitative'
            
    return desc

Float.get_description = get_description
