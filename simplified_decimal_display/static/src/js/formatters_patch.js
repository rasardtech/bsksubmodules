/** @odoo-module **/

import { localization } from "@web/core/l10n/localization";
import { FloatField } from "@web/views/fields/float/float_field";
import { MonetaryField } from "@web/views/fields/monetary/monetary_field";
import { patch } from "@web/core/utils/patch";
import { registry } from "@web/core/registry";
import { session } from "@web/session";

function formatLogic(formattedValue, options = {}, defaultType) {
    if (!formattedValue) {
        return "";
    }

    let formatType = options && options.format_type ? options.format_type : defaultType;

    if (formatType !== 'monetary') {
        if (options.fieldName) {
            const lowerName = options.fieldName.toLowerCase();
            if (lowerName.includes('price') || lowerName.includes('cost') || lowerName.includes('total') || lowerName.includes('amount')) {
                formatType = 'monetary';
            }
        }
        if (options.digits && Array.isArray(options.digits) && options.digits.length > 2) {
            formatType = options.digits[2];
        }
    }

    if (options && typeof options.digits === 'string') {
        const precisionName = options.digits;
        const config = session.decimal_precision_config || {};
        if (config[precisionName]) {
            formatType = config[precisionName];
        }
    }

    const decimalPoint = localization.decimalPoint;
    const esc = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const decPtEsc = esc(decimalPoint);

    const regex = new RegExp(`${decPtEsc}(\\d+)`);
    const match = formattedValue.match(regex);

    if (match) {
        let decimals = match[1];
        let newDecimals = decimals;

        if (formatType === 'quantitative') {
            newDecimals = decimals.replace(/0+$/, '');
        } else if (formatType === 'monetary') {
            newDecimals = decimals.replace(/0+$/, '');
            while (newDecimals.length < 2) {
                newDecimals += "0";
            }
        }

        if (decimals !== newDecimals) {
            if (newDecimals === "") {
                return formattedValue.replace(decimalPoint + decimals, "");
            }
            return formattedValue.replace(decimalPoint + decimals, decimalPoint + newDecimals);
        }
    }

    return formattedValue;
}

let originalFloatFormatter = null;
let originalMonetaryFormatter = null;
try {
    originalFloatFormatter = registry.category("formatters").get("float");
    originalMonetaryFormatter = registry.category("formatters").get("monetary");
} catch (e) {
    console.warn("Could not retrieve original formatters:", e);
}

registry.category("formatters").add("float", (value, options = {}) => {
    let original = "";
    if (originalFloatFormatter) {
        original = originalFloatFormatter(value, options);
    } else {
        return "";
    }

    return formatLogic(original, options, 'quantitative');
}, { force: true });

registry.category("formatters").add("monetary", (value, options = {}) => {
    let original = "";
    if (originalMonetaryFormatter) {
        original = originalMonetaryFormatter(value, options);
    } else {
        return "";
    }
    return formatLogic(original, options, 'monetary');
}, { force: true });


patch(FloatField.prototype, {
    get formattedValue() {
        const original = super.formattedValue;

        if (original === undefined || original === null) return original;

        const fieldDesc = this.props.record.fields[this.props.name];
        const formatType = fieldDesc.format_type || 'quantitative';

        const options = {
            format_type: formatType,
            fieldName: this.props.name,
            digits: fieldDesc.digits,
            ...this.props.options
        };

        return formatLogic(original, options, formatType);
    }
});

patch(MonetaryField.prototype, {
    get formattedValue() {
        const original = super.formattedValue;
        if (original === undefined || original === null) return original;

        const fieldDesc = this.props.record.fields[this.props.name];
        const formatType = fieldDesc.format_type || 'monetary';

        const options = {
            format_type: formatType,
            fieldName: this.props.name,
            digits: fieldDesc.digits,
            ...this.props.options
        };

        return formatLogic(original, options, formatType);
    }
});
