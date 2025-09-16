/** @odoo-module **/

import { localization as l10n } from "@web/core/l10n/localization";
import { registry } from "@web/core/registry";
import { escape, intersperse, nbsp, sprintf } from "@web/core/utils/strings";
import { session } from "@web/session";
import { markup } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { MonetaryField } from "@web/views/fields/monetary/monetary_field";
import { FloatField } from "@web/views/fields/float/float_field";
import { patch } from "@web/core/utils/patch";
import {
    formatFloat as formatFloatNumber,
    humanNumber,
    insertThousandsSep,
} from "@web/core/utils/numbers";
import { formatCurrency as  formatCurrencyNumber, getCurrency } from "@web/core/currency";
import { TaxTotalsComponent } from "@account/components/tax_totals/tax_totals";
import { toRaw } from "@odoo/owl";

// Helpers in module scope so all formatters can use them
function roundNineRun(num) {
    if (!Number.isFinite(num)) return 0;
    const neg = num < 0;
    const abs = Math.abs(num);
    // Use fixed representation to expose 9 runs from binary floats
    const s = abs.toFixed(15); // 15 is safe precision for JS double
    const m = s.match(/^(?<int>\d+)(?:\.(?<frac>\d+))?$/);
    if (!m) return num;
    let intStr = m.groups.int;
    const frac = m.groups.frac || "";
    const run = frac.match(/9{5,}/);
    if (!run) return num;
    const start = run.index;
    if (start === 0) {
        // 0.99999... -> int + 1
        let carryInt = 1;
        let out = "";
        for (let i = intStr.length - 1; i >= 0; i--) {
            const d = intStr.charCodeAt(i) - 48 + carryInt;
            if (d >= 10) {
                out = String(d - 10) + out;
                carryInt = 1;
            } else {
                out = String(d) + out;
                carryInt = 0;
            }
        }
        if (carryInt) out = "1" + out;
        const n = Number(out);
        return neg ? -n : n;
    }
    const keep = frac.slice(0, start);
    let pivotDigit = keep.slice(-1);
    let before = keep.slice(0, -1);
    let pivot = Number(pivotDigit) + 1;
    let carry = 0;
    if (pivot >= 10) {
        pivot = 0;
        carry = 1;
    }
    let beforeArr = before.split("");
    for (let i = beforeArr.length - 1; i >= 0 && carry; i--) {
        const d = beforeArr[i].charCodeAt(0) - 48 + carry;
        if (d >= 10) {
            beforeArr[i] = "0";
            carry = 1;
        } else {
            beforeArr[i] = String(d);
            carry = 0;
        }
    }
    if (carry) {
        // carry into integer part
        let out = "";
        let c = 1;
        for (let i = intStr.length - 1; i >= 0; i--) {
            const d = intStr.charCodeAt(i) - 48 + c;
            if (d >= 10) {
                out = String(d - 10) + out;
                c = 1;
            } else {
                out = String(d) + out;
                c = 0;
            }
        }
        if (c) out = "1" + out;
        intStr = out;
    }
    const newFrac = beforeArr.join("") + String(pivot);
    const joined = newFrac ? `${intStr}.${newFrac}` : intStr;
    const nnum = Number(joined);
    return neg ? -nnum : nnum;
}

function truncateTo7(num) {
    if (!Number.isFinite(num)) return 0;
    return Math.trunc(num * 1e7) / 1e7;
}

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

    const nineRounded = roundNineRun(value || 0);
    const truncated = truncateTo7(nineRounded);
    // Format with up to 7 decimals, then simplify (strip trailing zeros)
    const parts = truncated.toFixed(7).split(".");
    const intPart = insertThousandsSep(parts[0], thousandsSep, grouping);
    let frac = parts[1] || "";
    // Always simplify for non-monetary: remove trailing zeros entirely
    frac = frac.replace(/0+$/, "");
    return frac ? [intPart, frac].join(decimalPoint) : intPart;
}

registry.category("formatters").remove("float")
registry
    .category("formatters")
    .add("float", formatFloat)

export function formatCurrency(amount, currencyId, options = {}) {
    const currency = getCurrency(currencyId);
    const digits = options.digits || (currency && currency.digits);

    // Monetary rule: truncate raw to 7 decimals, then ensure minimum 2 decimals;
    // if more than 2, keep but strip trailing zeros beyond 2.
    const grouping = options.grouping || l10n.grouping;
    const thousandsSep = "thousandsSep" in options ? options.thousandsSep : l10n.thousandsSep;
    const decimalPoint = "decimalPoint" in options ? options.decimalPoint : l10n.decimalPoint;

    const truncateTo7 = (num) => {
        if (!Number.isFinite(num)) {
            return 0;
        }
        return Math.trunc(num * 1e7) / 1e7;
    };

    let formattedAmount;
    if (options.humanReadable) {
        const decimals = digits ? digits[1] : 2;
        formattedAmount = humanNumber(amount, { decimals });
    } else {
        let n = roundNineRun(amount || 0);
        // Monetary special case: if 9-run starts at or after 3rd fractional digit -> round to 2dp
        const s15 = Math.abs(n).toFixed(15);
        const mm = s15.match(/^\d+\.(\d+)$/);
        if (mm) {
            const f = mm[1];
            const r = f.match(/9{5,}/);
            if (r && r.index >= 2) {
                const rounded2 = Math.round(n * 100) / 100;
                n = rounded2;
            }
        }
        const truncated = truncateTo7(n);
        const parts = truncated.toFixed(7).split(".");
        const intPart = insertThousandsSep(parts[0], thousandsSep, grouping);
        let frac = (parts[1] || "").replace(/0+$/, "");
        if (frac.length < 2) {
            frac = (frac + "00").slice(0, 2);
        }
        formattedAmount = frac ? [intPart, frac].join(decimalPoint) : [intPart, "00"].join(decimalPoint);
    }

    if (!currency || options.noSymbol) {
        return formattedAmount;
    }
    const formatted = [currency.symbol, formattedAmount];
    if (currency.position === "after") {
        formatted.reverse();
    }
    return formatted.join(nbsp);
}

export function formatMonetary(value, options = {}) {
    // Monetary fields want to display nothing when the value is unset.
    // You wouldn't want a value of 0 euro if nothing has been provided.
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
    return formatCurrency(value, currencyId, options)
}

registry.category("formatters").remove("monetary")
registry.category("formatters").add("monetary", formatMonetary)

//to override Monetary widget -- it use formatMonetary
patch(MonetaryField.prototype, {
        get formattedValue() {
        if (this.props.inputType === "number" && !this.props.readonly && this.value !== undefined && this.value !== null) {
            return this.value;
        }
        return formatMonetary(this.value, {
            digits: this.currencyDigits,
            currencyId: this.currencyId,
            noSymbol: !this.props.readonly || this.props.hideSymbol,
        });
    }
})

// Ensure float fields also display formatted values even when editable
patch(FloatField.prototype, {
    get formattedValue() {
        if (this.props.inputType === "number" && !this.props.readonly && this.value !== undefined && this.value !== null) {
            return this.value;
        }
        return formatFloat(this.value, { digits: this.props.digits });
    }
});

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