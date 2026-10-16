import { onWillStart, useState } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { patch } from "@web/core/utils/patch";
import { BomOverviewControlPanel } from "@mrp/components/bom_overview_control_panel/mrp_bom_overview_control_panel";

patch(BomOverviewControlPanel.prototype, {
    setup() {
        super.setup(...arguments);
        this.orm = useService("orm");

        this.locationState = useState({
            locations: [],
            selectedLocationId: false,
        });

        onWillStart(async () => {
            await this.fetchLocations();
        });
    },

    async fetchLocations() {
        try {
            const domain = [["usage", "=", "internal"]];
            this.locationState.locations = await this.orm.searchRead("stock.location", domain, [
                "id",
                "display_name",
            ]);
        } catch {
            // Konum okuma yetkisi yoksa filtre gösterilmez (17 davranışı).
            this.locationState.locations = [];
        }
    },

    onLocationSelected(locationId) {
        const targetLocationId = locationId || false;
        this.locationState.selectedLocationId = targetLocationId;
        this.env.overviewBus?.trigger("change-location", targetLocationId);
    },

    get selectedLocationName() {
        const selectedId = this.locationState.selectedLocationId;
        const loc = selectedId && this.locationState.locations.find((l) => l.id === selectedId);
        return loc ? loc.display_name : _t("Location");
    },

    // 19.0: Dropdown toggler/DropdownItem slot API'si yerine items listesi
    // (standart warehousesItems ile aynı yapı).
    get locationItems() {
        const selectedId = this.locationState.selectedLocationId;
        return [
            {
                id: 0,
                label: _t("All Locations"),
                class: { selected: !selectedId },
                onSelected: () => this.onLocationSelected(false),
            },
            ...this.locationState.locations.map((loc) => ({
                id: loc.id,
                label: loc.display_name,
                class: { selected: selectedId === loc.id },
                onSelected: () => this.onLocationSelected(loc.id),
            })),
        ];
    },
});
