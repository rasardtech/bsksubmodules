from odoo import models

class HrExpenseSheet(models.Model):
    _inherit = 'hr.expense.sheet'

    def action_reset_expense_sheets(self):
        for sheet in self:
            if sheet.account_move_ids:
                sheet.account_move_ids.button_draft()
        return self.write({'state': 'draft', 'approval_date': False, 'user_id': False})

    def action_submit_sheet(self):
        res = super().action_submit_sheet()
        self.mapped('account_move_ids').filtered(lambda m: m.state == 'draft').action_post()
        return res

    def unlink(self):
        moves_to_delete = self.mapped('account_move_ids').filtered(lambda m: m.state == 'draft')
        res = super().unlink()
        if moves_to_delete:
            moves_to_delete.unlink()
        return res