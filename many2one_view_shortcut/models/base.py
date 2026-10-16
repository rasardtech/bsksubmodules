# -*- coding: utf-8 -*-

from odoo import models

class Many2oneInherit(models.AbstractModel):
    _inherit = "base"

    def get_formview_newtab_action(self, access_uid=None):
        model_name = self._name
        record_id = self.id
        if model_name == 'product.product':
            if self.product_tmpl_id:
                model_name = 'product.template'
                record_id = self.product_tmpl_id.id
        # 19.0: /web#id=..&model=.. eski URL hâlâ yönlenir; doğrudan yeni biçim
        # (web Many2One.linkHref ile aynı: noktasız model adına "m-" öneki).
        url_model = model_name if "." in model_name else f"m-{model_name}"
        redirect_url = f"/odoo/{url_model}/{record_id}"
        return {
            'type': 'ir.actions.act_url',
            'url': redirect_url,
            'target': 'new',
        }

    def get_wizardview_action(self, access_uid=None):
        model_name = self._name
        record_id = self.id
        target_record = self
        if model_name == 'product.product':
            if self.product_tmpl_id:
                model_name = 'product.template'
                record_id = self.product_tmpl_id.id
                target_record = self.product_tmpl_id
        view_id = target_record.sudo().get_formview_id(access_uid=access_uid)
        return {
            'type': 'ir.actions.act_window',
            'res_model': model_name,
            'views': [(view_id, 'form')],
            'target': 'new',
            'res_id': record_id,
            'context': dict(self.env.context),
        }


