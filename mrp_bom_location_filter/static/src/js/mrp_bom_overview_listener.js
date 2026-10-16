import { patch } from "@web/core/utils/patch";
import { useBus } from "@web/core/utils/hooks";
import { BomOverviewComponent } from "@mrp/components/bom_overview/mrp_bom_overview";

// 19.0: bileşen adı BomOverviewComponent (17'deki farklı export adları
// denemesine gerek yok). Bus dinleyicisi useBus ile (unmount'ta temizlenir).
patch(BomOverviewComponent.prototype, {
    setup() {
        super.setup();
        useBus(this.env.overviewBus, "change-location", (ev) => this.onChangeLocation(ev));
    },

    async onChangeLocation(ev) {
        // this.context === this.props.action.context (aynı nesne); getBomData
        // bunu kopyalayıp get_html'e gönderir, python tarafı 'location'a çevirir.
        this.props.action.context.bom_location_id = ev.detail;
        await this.getBomData();
    },
});
