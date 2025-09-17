/** @odoo-module **/

import { localization as l10n } from "@web/core/l10n/localization";
import { registry } from "@web/core/registry";
import { escape, intersperse, nbsp, sprintf } from "@web/core/utils/strings";
import { session } from "@web/session";
import { markup } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { MonetaryField } from "@web/views/fields/monetary/monetary_field";
import { patch } from "@web/core/utils/patch";
import {
    formatFloat as formatFloatNumber,
    humanNumber,
    insertThousandsSep,
} from "@web/core/utils/numbers";
import { formatCurrency as  formatCurrencyNumber, getCurrency } from "@web/core/currency";
import { TaxTotalsComponent } from "@account/components/tax_totals/tax_totals";
import { toRaw } from "@odoo/owl";

export function formatFloat(value, options = {}) {
    if (value === false) {
        return "";
    }

    if (options.humanReadable) {
        return humanNumber(value, options);
    }
    const grouping = options.grouping || l10n.grouping;
    const thousandsSep = "thousandsSep" in options ? options.thousandsSep : l10n.thousandsSep;
    const decimalPoint = "decimalPoint" in options ? options.decimalPoint : l10n.decimalPoint;
    let precision;
    if (options.digits && options.digits[1] !== undefined) {
        precision = options.digits[1];
    } else {
        precision = 2;
    }

    // Truncate raw numeric value to at most 7 decimals (no rounding), then format
    const truncateDecimals = (num, digits) => {
        if (!isFinite(num)) return num;
        const factor = Math.pow(10, digits);
        return Math.trunc(num * factor) / factor;
    };
    const truncated = truncateDecimals(value || 0, 7);

    const formatted = truncated.toFixed(precision).split(".");
    formatted[0] = insertThousandsSep(formatted[0], thousandsSep, grouping);

    // Always strip trailing zeros for non-monetary floats
    if (formatted[1]) {
        formatted[1] = formatted[1].replace(/0+$/, "");
    }

    return formatted[1] ? formatted.join(decimalPoint) : formatted[0];
}

registry.category("formatters").remove("float")
registry
    .category("formatters")
    .add("float", formatFloat)

export function formatCurrency(amount, currencyId, options = {}) {
    // Delegate to Odoo's original currency formatter to keep monetary unchanged
    return formatCurrencyNumber(amount, currencyId, options);
}

export function formatMonetary(value, options = {}) {
    // Delegate to Odoo's original currency formatter-based logic
    // Monetary fields want to display nothing when the value is unset.
    if (value === false) {
        return "";
    }

    let currencyId = options.currencyId;
    if (!currencyId && options.data) {
        const currencyField =
            options.currencyField ||
            (options.field && options.field.currency_field) ||
            "currency_id";
        const dataValue = options.data[currencyField];
        currencyId = Array.isArray(dataValue) ? dataValue[0] : dataValue;
    }
    return formatCurrencyNumber(value, currencyId, options);
}

registry.category("formatters").remove("monetary")
registry.category("formatters").add("monetary", formatMonetary)

//to override Monetary widget -- it use formatMonetary
patch(MonetaryField.prototype, {
        get formattedValue() {
        if (this.props.inputType === "number" && !this.props.readonly && this.value) {

            return this.value;
        }
//        console.log(this.value);
        return formatMonetary(this.value, {
            digits: this.currencyDigits,
            currencyId: this.currencyId,
            noSymbol: !this.props.readonly || this.props.hideSymbol,
        });
    }
})

//to override Monetary widget -- it use formatMonetary -- override same method
patch(TaxTotalsComponent.prototype, {
      formatData(props) {
        let totals = JSON.parse(JSON.stringify(toRaw(props.record.data[this.props.name])));
        if (!totals) {
            return;
        }
        const currencyFmtOpts = { currencyId: props.record.data.currency_id && props.record.data.currency_id[0] };

        let amount_untaxed = totals.amount_untaxed;
        let amount_tax = 0;
        let subtotals = [];
        for (let subtotal_title of totals.subtotals_order) {
            let amount_total = amount_untaxed + amount_tax;
            subtotals.push({
                'name': subtotal_title,
                'amount': amount_total,
                'formatted_amount': formatMonetary(amount_total, currencyFmtOpts),
            });
            let group = totals.groups_by_subtotal[subtotal_title];
            for (let i in group) {
                amount_tax = amount_tax + group[i].tax_group_amount;
            }
        }
        totals.subtotals = subtotals;
        let rounding_amount = totals.display_rounding && totals.rounding_amount || 0;
        let amount_total = amount_untaxed + amount_tax + rounding_amount;
        totals.amount_total = amount_total;
        totals.formatted_amount_total = formatMonetary(amount_total, currencyFmtOpts);
        for (let group_name of Object.keys(totals.groups_by_subtotal)) {
            let group = totals.groups_by_subtotal[group_name];
            for (let key in group) {
                group[key].formatted_tax_group_amount = formatMonetary(group[key].tax_group_amount, currencyFmtOpts);
                group[key].formatted_tax_group_base_amount = formatMonetary(group[key].tax_group_base_amount, currencyFmtOpts);
            }
        }
        this.totals = totals;
    }
})