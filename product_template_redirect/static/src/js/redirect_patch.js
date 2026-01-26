/** @odoo-module **/

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

const fieldRegistry = registry.category("fields");
const many2oneItem = fieldRegistry.get("many2one");

if (many2oneItem) {
    const Many2OneField = many2oneItem.component;

    if (Many2OneField.components && Many2OneField.components.Many2One) {
        const Many2OneComponent = Many2OneField.components.Many2One;

        patch(Many2OneComponent.prototype, {
            async openRecord(mode) {
                if (mode === 'action' && this.props.relation === 'product.product' && this.props.value) {
                    try {
                        const result = await this.orm.read("product.product", [this.props.value.id], ["product_tmpl_id"]);
                        if (result && result.length > 0 && result[0].product_tmpl_id) {
                            return this.action.doAction({
                                type: 'ir.actions.act_window',
                                res_model: 'product.template',
                                res_id: result[0].product_tmpl_id[0],
                                views: [[false, 'form']],
                                target: 'current',
                            });
                        }
                    } catch (error) {
                    }
                }
                return super.openRecord(mode);
            }
        });
    } else {
        patch(Many2OneField.prototype, {
            setup() {
                super.setup();
                this.orm = useService("orm");
                this.actionService = useService("action");
            },

            async openAction() {
                const relation = this.props.relation || this.relation;
                const fieldName = this.props.name;

                if (relation === 'product.product') {
                    const recordData = this.props.record ? this.props.record.data : null;
                    const fieldValue = recordData ? recordData[fieldName] : null;

                    if (fieldValue) {
                        const productId = Array.isArray(fieldValue) ? fieldValue[0] : (fieldValue.id || fieldValue);

                        if (productId) {
                            try {
                                const result = await this.orm.read("product.product", [productId], ["product_tmpl_id"]);

                                if (result && result.length > 0 && result[0].product_tmpl_id) {
                                    const action = this.actionService || this.env.services.action;

                                    return action.doAction({
                                        type: 'ir.actions.act_window',
                                        res_model: 'product.template',
                                        res_id: result[0].product_tmpl_id[0],
                                        views: [[false, 'form']],
                                        target: 'current',
                                    });
                                }
                            } catch (error) {
                            }
                        }
                    }
                }
                return super.openAction();
            }
        });
    }
}