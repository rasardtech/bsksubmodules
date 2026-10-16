from odoo import models


class HrExpense(models.Model):
    _inherit = "hr.expense"

    # 19.0 notu: hr.expense.sheet kaldırıldı; yevmiye kaydı doğrudan masrafa
    # (account_move_id) bağlı. 17'deki davranışlar şöyle taşındı:
    # - action_reset_expense_sheets -> action_reset (aşağıda).
    # - action_sheet_move_create (taslak kaydı silip yeniden oluşturma): 19'da
    #   action_post yalnız 'approved' (kaydı olmayan) masrafta çalışır ve
    #   standart action_reset taslak kaydı zaten siler -> override gereksiz.
    # - unlink (taslak kaydı silme): 19'da kaydı olan masrafın durumu
    #   'posted'/'paid' olur ve standart _unlink_except_approved silmeyi
    #   engeller; taslak masrafın kaydı olamaz -> override gereksiz.
    # - 'Reset' butonu: 19 standart formunda muhasebe grubuna tüm taslak dışı
    #   durumlarda (şirket ödemeli 'paid' dahil) görünür -> view gereksiz.

    def action_reset(self):
        """Yevmiye kaydını ters kayıtla iptal etmek yerine siler.

        Standart 19, deftere işlenmiş kayda bağlı masrafın sıfırlanmasına izin
        vermez. Bu override, masrafın kaydını ve onunla mutabakatı yapılmış karşı
        kayıtları (geri ödeme vb.) taslağa çekip siler; böylece yeniden
        işlendiğinde defterde tek kayıt kalır.
        """
        if not all(self.mapped("can_reset")):
            # Yetki kontrolünü ve hata mesajını standarda bırak.
            return super().action_reset()

        moves_to_delete = self.account_move_id
        for line in moves_to_delete.line_ids:
            moves_to_delete |= line.matched_debit_ids.debit_move_id.move_id
            moves_to_delete |= line.matched_credit_ids.credit_move_id.move_id

        if moves_to_delete:
            # 17'de account.payment, account.move'u _inherits ile taşıyordu ve
            # kayıt silinince ödeme de silinirdi. 19'da ödeme ayrı model:
            # ödemeye ait kayıtlar ödeme üzerinden silinir (payment.unlink kaydı
            # taslağa çekip siler). Yevmiye kaydı olmayan eşleşmiş ödemeler
            # (matched_payment_ids) de aynı kapsamda.
            payments = (
                moves_to_delete.origin_payment_id
                | self.account_move_id.matched_payment_ids
            )
            other_moves = moves_to_delete - payments.move_id
            payments.unlink()
            other_moves.filtered(lambda m: m.state != "draft").button_draft()
            other_moves.unlink()
            self.invalidate_recordset(["account_move_id"])

        return super().action_reset()
