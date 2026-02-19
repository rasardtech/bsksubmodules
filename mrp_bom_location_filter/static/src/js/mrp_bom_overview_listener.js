/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import * as BomOverviewModule from "@mrp/components/bom_overview/mrp_bom_overview";

const BomOverview = BomOverviewModule.BomOverviewComponent || BomOverviewModule.BomOverview || BomOverviewModule.default;

if (BomOverview) {
    patch(BomOverview.prototype, {
        setup() {
            super.setup();
            if (this.env.overviewBus) {
                this.env.overviewBus.addEventListener("change-location", this.onChangeLocation.bind(this));
            }
        },

        async onChangeLocation(ev) {
            const locationId = ev.detail;

            if (this.props.action && this.props.action.context) {
                this.props.action.context.bom_location_id = locationId;
            }

            if (this.getBomData) {
                await this.getBomData();
            } else if (this.reload) {
                await this.reload(); 
            }
        }
    });
}