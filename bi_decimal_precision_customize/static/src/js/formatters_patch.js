import { localization } from "@web/core/l10n/localization";
import { FloatField } from "@web/views/fields/float/float_field";
import { MonetaryField } from "@web/views/fields/monetary/monetary_field";
import { patch } from "@web/core/utils/patch";
import { registry } from "@web/core/registry";
import { Record } from "@web/model/relational_model/record";

/**
 * Custom formatter logic.
 */
function formatLogic(value, options = {}, defaultType) {
    if (value === false || value === undefined) {
        return "";
    }

    const decimalPoint = localization.decimalPoint;
    const thousandsSep = localization.thousandsSep;

    // Check if format_type is provided in options, otherwise use defaultType
    const formatType = options && options.format_type ? options.format_type : defaultType;

    let decimals = 2;
    if (options && options.digits && Array.isArray(options.digits)) {
        decimals = options.digits[1];
    }

    let n = value;
    if (typeof n !== 'number') {
        n = parseFloat(n);
    }

    // Use toFixed to get the max decimals
    let fixed = n.toFixed(decimals);

    let parts = fixed.split('.');
    let integerPart = parts[0];
    let fractionalPart = parts[1] || "";

    if (formatType === 'quantitative') {
        // Strip all trailing zeros
        fractionalPart = fractionalPart.replace(/0+$/, '');
    } else if (formatType === 'monetary') {
        // Strip trailing zeros but keep min 2 decimals
        fractionalPart = fractionalPart.replace(/0+$/, '');
        while (fractionalPart.length < 2) {
            fractionalPart += "0";
        }
    }

    // Format integer part with thousands separator
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);

    if (fractionalPart.length > 0) {
        return `${formattedInteger}${decimalPoint}${fractionalPart}`;
    } else {
        return formattedInteger;
    }
}

// Registry Formatters
// These are used by ListRenderer in readonly mode and other non-component views.

const customFloatFormatter = (value, options = {}) => {
    // Default to 'quantitative' for standard float fields
    return formatLogic(value, options, 'quantitative');
};

const customMonetaryFormatter = (value, options = {}) => {
    // We need to handle currency symbol if possible, BUT standard formatter usually handles it separately?
    // In Odoo, 'monetary' formatter usually returns number AND symbol.
    // Wait, the 'monetary' formatter in registry usually just formats the number if it's used for the value part?
    // NO, registry.category("formatters").get("monetary") usually handles full string.

    // If we replace it, we might lose currency symbol logic if we are not careful.
    // Standard `formatMonetary` implementation uses `formatCurrency` or similar.

    // Let's wrap the original monetary formatter if possible?
    // We can't easily access the 'original' one inside the override if we replace it in the registry.
    // However, we can fetch it before replacing?
    // But `registry` is global.

    // NOTE: The user's issue is specific to "Unit Price" (Monetary) and "Quantity".
    // "Unit Price" in Purchase Lines usually uses `widget="monetary"`.
    // If we replace the `monetary` formatter, we must replicate the currency symbol logic.

    // Getting the original formatter:
    // We can't reliable get "super". 

    // Alternative:
    // Patching the registry using `patch`? 
    // No, registry is not patchable class.

    // If we can't safely replace `monetary` formatter because of currency symbol complexity, 
    // we should look at `options`.

    // Let's implement `customMonetaryFormatter` by calling `formatLogic` (which formats the number)
    // AND appending currency symbol from options?
    // options usually has `currency`.

    // Actually, `formatMonetary` in Odoo source:
    // renders currency + formatted number.
    // It calls `formatFloat` for the number.
    // If we REPLACE `float` formatter in registry, `monetary` formatter (which calls `formatFloat`) might use OUR formatter?
    // IF `monetary` formatter imports `formatFloat`, it uses the imported one (unchanged).
    // IF `monetary` formatter uses registry.get('float'), it uses ours.
    // Standard Odoo usually imports `formatFloat`. So patching registry 'float' won't affect `monetary` formatter's internal number formatting.

    // So we MUST patch `monetary` formatter too.

    // Simplified Monetary Formatter:
    // (We accept that we might deviate slightly from standard Odoo rendering of currency position if we write our own, 
    // but we can look at `localization` to do it right).

    // Safe bet: For now, I will NOT replace the `monetary` formatter entirely if I can avoid it.
    // But I have to.

    // Actually, I can allow `customMonetaryFormatter` to delegate to `originalMonetary` if I save it?
    // Const originalMonetary = registry.category("formatters").get("monetary");
    // But this file runs at module load. Original might not be loaded yet? 
    // Odoo modules order matters. 'web' is loaded.

    // Let's try to capture original.

    // BUT, the user's issue is 1,50000 -> 1,50.
    // If I just string-manipulate the result of original formatter?

    const formatted = originalMonetaryFormatter(value, options);
    // Regex replace the number part to strip zeros (while keeping 2 decimals).
    // Reuse `formatType='monetary'` logic on the extracted number.

    // This is safer.

    return formatted;
};

// Capture originals
let originalFloatFormatter;
let originalMonetaryFormatter;

try {
    originalFloatFormatter = registry.category("formatters").get("float");
    originalMonetaryFormatter = registry.category("formatters").get("monetary");
} catch (e) {
    // fallback
}

// Registry Overrides
registry.category("formatters").add("float", (value, options = {}) => {
    // For float, we replace logic entirely because we want to strip zeros (Quantitative)
    return formatLogic(value, options, 'quantitative');
}, { force: true });

registry.category("formatters").add("monetary", (value, options = {}) => {
    if (!originalMonetaryFormatter) {
        // Should not happen if web is loaded
        return "";
    }
    const original = originalMonetaryFormatter(value, options);
    if (!original) return original;

    const decimalPoint = localization.decimalPoint;
    // Regex cleanup
    // We assume the number part handles the decimals.

    // Find sequence of digits+decimal+digits
    // We need to be careful about not stripping symbol digits (unlikely).

    const esc = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const decPtEsc = esc(decimalPoint);

    // Regex: Look for decimal point followed by digits at the end of a number block?
    // e.g. "123,45000" (comma dec) or "123.45000" (dot dec)

    // Capturing group for the decimals
    const regex = new RegExp(`${decPtEsc}(\\d+)`);
    const match = original.match(regex);

    if (match) {
        let decimals = match[1];
        // Apply Monetary logic
        let newDecimals = decimals.replace(/0+$/, '');
        while (newDecimals.length < 2) {
            newDecimals += "0";
        }
        // Replace ONLY the matching part
        // Be careful if multiple matches (unlikely in single value)
        return original.replace(decimalPoint + decimals, decimalPoint + newDecimals);
    }

    return original;
}, { force: true });


// Components Patches (Keep these as they allow utilizing format_type from field desc if available)

patch(FloatField.prototype, {
    get formattedValue() {
        const fieldDesc = this.props.record.fields[this.props.name];
        const formatType = fieldDesc.format_type || 'quantitative';
        const digits = fieldDesc.digits;

        const val = this.props.record.data[this.props.name];
        const options = {
            digits: digits,
            format_type: formatType,
            ...this.props.options
        };

        return formatLogic(val, options, formatType);
    }
});

patch(MonetaryField.prototype, {
    get formattedValue() {
        const original = super.formattedValue;
        const fieldDesc = this.props.record.fields[this.props.name];
        // Check manually if it is 'quantitative' (unlikely for Monetary field) or 'monetary'
        const formatType = fieldDesc.format_type || 'monetary';

        if (formatType === 'monetary') {
            // Logic to strip zeros but keep 2 decimals
            const decimalPoint = localization.decimalPoint;
            const esc = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const decPtEsc = esc(decimalPoint);
            const regex = new RegExp(`${decPtEsc}(\\d+)`);
            const match = original.match(regex);

            if (match) {
                let decimals = match[1];
                let newDecimals = decimals.replace(/0+$/, '');
                while (newDecimals.length < 2) {
                    newDecimals += "0";
                }
                return original.replace(decimalPoint + decimals, decimalPoint + newDecimals);
            }
        }
        return original;
    }
});
