import { patch } from "@web/core/utils/patch";
import { Many2One } from "@web/views/fields/many2one/many2one";

// 19.0: Many2OneField artık iç bileşen Many2One'ı sarıyor; buton/aksiyon
// mantığı Many2One'da (props.relation, props.value, props.context).
patch(Many2One.prototype, {
    async onExternalNewTabBtnClick(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        const action = await this.orm.call(
            this.props.relation,
            "get_formview_newtab_action",
            [[this.props.value.id]],
            { context: this.props.context }
        );
        const url = action && action.url;
        if (url) {
            window.open(url, "_blank", "noopener");
            window.focus();
        } else {
            await this.action.doAction(action);
        }
    },
    async onExternalWizardBtnClick(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        const action = await this.orm.call(
            this.props.relation,
            "get_wizardview_action",
            [[this.props.value.id]],
            { context: this.props.context }
        );
        await this.action.doAction(action);
    },
});
