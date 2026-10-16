import { patch } from "@web/core/utils/patch";
import { Many2One } from "@web/views/fields/many2one/many2one";

// 19.0: Many2OneField, iç bileşen Many2One'ı kullanıyor; kayıt açma
// Many2One.openRecord(mode) üzerinden. 17'deki openAction dalı kaldırıldı.
// 'action' modu: salt okunur bağlantı ve (dialog dışında) iç bağlantı butonu.
patch(Many2One.prototype, {
    async openRecord(mode) {
        if (mode === "action" && this.props.relation === "product.product" && this.props.value) {
            try {
                const result = await this.orm.read(
                    "product.product",
                    [this.props.value.id],
                    ["product_tmpl_id"]
                );
                if (result && result.length > 0 && result[0].product_tmpl_id) {
                    return this.action.doAction({
                        type: "ir.actions.act_window",
                        res_model: "product.template",
                        res_id: result[0].product_tmpl_id[0],
                        views: [[false, "form"]],
                        target: "current",
                    });
                }
            } catch {
                // Okunamazsa standart davranışa düş.
            }
        }
        return super.openRecord(mode);
    },
});
