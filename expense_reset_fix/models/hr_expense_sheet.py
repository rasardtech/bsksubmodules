from odoo import models, fields, api, _
from odoo.exceptions import UserError

class HrExpenseSheet(models.Model):
    _inherit = 'hr.expense.sheet'

    def action_reset_expense_sheets(self):
        for sheet in self:
            moves_to_delete = sheet.account_move_ids
            
            for move in sheet.account_move_ids:
                for line in move.line_ids:
                    moves_to_delete |= line.matched_debit_ids.debit_move_id.move_id
                    moves_to_delete |= line.matched_credit_ids.credit_move_id.move_id
            
            if moves_to_delete:
                for move in moves_to_delete:
                    move.button_draft()
                moves_to_delete.unlink()
            
            if sheet.state == 'done':
                sheet.write({'state': 'post'}) 

        return super(HrExpenseSheet, self).action_reset_expense_sheets()

    def action_sheet_move_create(self):
        for sheet in self:
            draft_moves = sheet.account_move_ids.filtered(lambda m: m.state == 'draft')
            draft_moves.unlink()
        
        res = super(HrExpenseSheet, self).action_sheet_move_create()
        return res

    def unlink(self):
        for sheet in self:
            draft_moves = sheet.account_move_ids.filtered(lambda m: m.state == 'draft')
            draft_moves.unlink()
        return super(HrExpenseSheet, self).unlink()
