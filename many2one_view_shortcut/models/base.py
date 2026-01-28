# -*- coding: utf-8 -*-

from odoo import api, fields, models, _

class Many2oneInherit(models.AbstractModel):
    _inherit = "base"

    def get_formview_newtab_action(self, access_uid=None):
        model_name = self._name
        record_id = self.id
        if model_name == 'product.product':
            if self.product_tmpl_id:
                model_name = 'product.template'
                record_id = self.product_tmpl_id.id
        redirect_url = f"/web#id={record_id}&model={model_name}&view_type=form"
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
            'context': dict(self._context),
        }


