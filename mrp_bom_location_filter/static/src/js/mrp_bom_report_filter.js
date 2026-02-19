/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { BomOverviewControlPanel } from "@mrp/components/bom_overview_control_panel/mrp_bom_overview_control_panel";
import { useService } from "@web/core/utils/hooks";
import { useState, onWillStart } from "@odoo/owl";

patch(BomOverviewControlPanel.prototype, {
    setup() {
        super.setup(...arguments);
        this.orm = useService("orm");

        let initialLoc = false;
        if (this.env.config && this.env.config.actionContext) {
             initialLoc = this.env.config.actionContext.bom_location_id || false;
        } else if (this.props.context) {
             initialLoc = this.props.context.bom_location_id || false;
        }

        this.locationState = useState({
            locations: [],
            selectedLocationId: initialLoc
        });

        onWillStart(async () => {
            await this.fetchLocations();
        });
    },

    async fetchLocations() {
        try {
            const domain = [['usage', '=', 'internal']];
            this.locationState.locations = await this.orm.searchRead('stock.location', domain, ['id', 'display_name']);
        } catch (e) {
        }
    },

    onLocationSelected(locationId) {
        const targetLocationId = locationId || false;
        
        this.locationState.selectedLocationId = targetLocationId;
        
        if (this.env.overviewBus) {
             this.env.overviewBus.trigger("change-location", targetLocationId);
        }
    },

    get selectedLocationName() {
        if (!this.locationState.selectedLocationId) return " Location";
        const loc = this.locationState.locations.find(l => l.id === this.locationState.selectedLocationId);
        return loc ? "\u00A0" + loc.display_name : " Location";
    }
});