const fs = require('fs');
const path = require('path');
const localesDir = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales');

const translations = {
  ca: {
    'tickets.allStatuses': 'Tots els estats',
    'tickets.allAgents': 'Tots els agents',
    'tickets.assignToMe': 'Assignar a mi',
    'tickets.assignedToYou': 'Assignat a tu',
    'tickets.reassign': 'Reassignar',
    'tickets.resolveAction': 'Resoldre Tiquet',
    'tickets.closeAction': 'Tancar Tiquet',
    'tickets.reopenAction': 'Reobrir Tiquet',
    'tickets.deleteTicket': 'Eliminar Tiquet',
    'tickets.confirmDelete': 'Estàs segur que vols eliminar aquest tiquet permanentment? Aquesta acció esborrarà tots els seus missatges i no es pot desfer.',
    'tickets.deletedSuccess': 'Tiquet eliminat correctament',
    'tickets.ticketDeletedAlert': 'Tiquet eliminat',
    'tickets.pressCtrlEnter': 'Ctrl+Enter per enviar'
  },
  en: {
    'tickets.allStatuses': 'All statuses',
    'tickets.allAgents': 'All agents',
    'tickets.assignToMe': 'Assign to me',
    'tickets.assignedToYou': 'Assigned to you',
    'tickets.reassign': 'Reassign',
    'tickets.resolveAction': 'Resolve Ticket',
    'tickets.closeAction': 'Close Ticket',
    'tickets.reopenAction': 'Reopen Ticket',
    'tickets.deleteTicket': 'Delete Ticket',
    'tickets.confirmDelete': 'Are you sure you want to delete this ticket permanently? This action will delete all its messages and cannot be undone.',
    'tickets.deletedSuccess': 'Ticket deleted successfully',
    'tickets.ticketDeletedAlert': 'Ticket deleted',
    'tickets.pressCtrlEnter': 'Ctrl+Enter to send'
  },
  fr: {
    'tickets.allStatuses': 'Tous les statuts',
    'tickets.allAgents': 'Tous les agents',
    'tickets.assignToMe': 'M\'assigner',
    'tickets.assignedToYou': 'Assigné à vous',
    'tickets.reassign': 'Réassigner',
    'tickets.resolveAction': 'Résoudre le ticket',
    'tickets.closeAction': 'Fermer le ticket',
    'tickets.reopenAction': 'Rouvrir le ticket',
    'tickets.deleteTicket': 'Supprimer le ticket',
    'tickets.confirmDelete': 'Êtes-vous sûr de vouloir supprimer définitivement ce ticket ? Cette action supprimera tous ses messages et ne peut être annulée.',
    'tickets.deletedSuccess': 'Ticket supprimé avec succès',
    'tickets.ticketDeletedAlert': 'Ticket supprimé',
    'tickets.pressCtrlEnter': 'Ctrl+Entrée pour envoyer'
  },
  de: {
    'tickets.allStatuses': 'Alle Status',
    'tickets.allAgents': 'Alle Agenten',
    'tickets.assignToMe': 'Mir zuweisen',
    'tickets.assignedToYou': 'Ihnen zugewiesen',
    'tickets.reassign': 'Neu zuweisen',
    'tickets.resolveAction': 'Ticket lösen',
    'tickets.closeAction': 'Ticket schließen',
    'tickets.reopenAction': 'Ticket wiedereröffnen',
    'tickets.deleteTicket': 'Ticket löschen',
    'tickets.confirmDelete': 'Sind Sie sicher, dass Sie dieses Ticket dauerhaft löschen möchten? Diese Aktion löscht alle Nachrichten und kann nicht rückgängig gemacht werden.',
    'tickets.deletedSuccess': 'Ticket erfolgreich gelöscht',
    'tickets.ticketDeletedAlert': 'Ticket gelöscht',
    'tickets.pressCtrlEnter': 'Strg+Eingabe zum Senden'
  },
  it: {
    'tickets.allStatuses': 'Tutti gli stati',
    'tickets.allAgents': 'Tutti gli agenti',
    'tickets.assignToMe': 'Assegna a me',
    'tickets.assignedToYou': 'Assegnato a te',
    'tickets.reassign': 'Riassegna',
    'tickets.resolveAction': 'Risolvi Ticket',
    'tickets.closeAction': 'Chiudi Ticket',
    'tickets.reopenAction': 'Riapri Ticket',
    'tickets.deleteTicket': 'Elimina Ticket',
    'tickets.confirmDelete': 'Sei sicuro di voler eliminare definitivamente questo ticket? Questa azione cancellerà tutti i suoi messaggi e non può essere annullata.',
    'tickets.deletedSuccess': 'Ticket eliminato con successo',
    'tickets.ticketDeletedAlert': 'Ticket eliminato',
    'tickets.pressCtrlEnter': 'Ctrl+Invio per inviare'
  },
  pt: {
    'tickets.allStatuses': 'Todos os estados',
    'tickets.allAgents': 'Todos os agentes',
    'tickets.assignToMe': 'Atribuir a mim',
    'tickets.assignedToYou': 'Atribuído a si',
    'tickets.reassign': 'Reatribuir',
    'tickets.resolveAction': 'Resolver Ticket',
    'tickets.closeAction': 'Fechar Ticket',
    'tickets.reopenAction': 'Reabrir Ticket',
    'tickets.deleteTicket': 'Eliminar Ticket',
    'tickets.confirmDelete': 'Tem a certeza de que deseja eliminar este ticket permanentemente? Esta ação apagará todas as mensagens e não pode ser anulada.',
    'tickets.deletedSuccess': 'Ticket eliminado com sucesso',
    'tickets.ticketDeletedAlert': 'Ticket eliminado',
    'tickets.pressCtrlEnter': 'Ctrl+Enter para enviar'
  },
  ar: {
    'tickets.allStatuses': 'جميع الحالات',
    'tickets.allAgents': 'جميع الوكلاء',
    'tickets.assignToMe': 'تعيين لي',
    'tickets.assignedToYou': 'مُعين لك',
    'tickets.reassign': 'إعادة التعيين',
    'tickets.resolveAction': 'حل التذكرة',
    'tickets.closeAction': 'إغلاق التذكرة',
    'tickets.reopenAction': 'إعادة فتح التذكرة',
    'tickets.deleteTicket': 'حذف التذكرة',
    'tickets.confirmDelete': 'هل أنت متأكد أنك تريد حذف هذه التذكرة نهائيًا؟ سيؤدي هذا الإجراء إلى حذف جميع الرسائل ولا يمكن التراجع عنه.',
    'tickets.deletedSuccess': 'تم حذف التذكرة بنجاح',
    'tickets.ticketDeletedAlert': 'تم حذف التذكرة',
    'tickets.pressCtrlEnter': 'Ctrl+Enter للإرسال'
  },
  zh: {
    'tickets.allStatuses': '所有状态',
    'tickets.allAgents': '所有客服',
    'tickets.assignToMe': '分配给我',
    'tickets.assignedToYou': '已分配给您',
    'tickets.reassign': '重新分配',
    'tickets.resolveAction': '解决工单',
    'tickets.closeAction': '关闭工单',
    'tickets.reopenAction': '重新打开工单',
    'tickets.deleteTicket': '删除工单',
    'tickets.confirmDelete': '您确定要永久删除此工单吗？此操作将删除其所有消息且无法撤销。',
    'tickets.deletedSuccess': '工单删除成功',
    'tickets.ticketDeletedAlert': '工单已删除',
    'tickets.pressCtrlEnter': 'Ctrl+Enter 发送'
  },
  ja: {
    'tickets.allStatuses': 'すべてのステータス',
    'tickets.allAgents': 'すべての担当者',
    'tickets.assignToMe': '自分に割り当てる',
    'tickets.assignedToYou': 'あなたに割り当てられました',
    'tickets.reassign': '再割り当て',
    'tickets.resolveAction': 'チケットを解決',
    'tickets.closeAction': 'チケットをクローズ',
    'tickets.reopenAction': 'チケットを再オープン',
    'tickets.deleteTicket': 'チケットを削除',
    'tickets.confirmDelete': 'このチケットを完全に削除してもよろしいですか？この操作によりすべてのメッセージが削除され、元に戻すことはできません。',
    'tickets.deletedSuccess': 'チケットが正常に削除されました',
    'tickets.ticketDeletedAlert': 'チケットが削除されました',
    'tickets.pressCtrlEnter': 'Ctrl+Enter で送信'
  },
  ru: {
    'tickets.allStatuses': 'Все статусы',
    'tickets.allAgents': 'Все агенты',
    'tickets.assignToMe': 'Назначить мне',
    'tickets.assignedToYou': 'Назначено вам',
    'tickets.reassign': 'Переназначить',
    'tickets.resolveAction': 'Решить тикет',
    'tickets.closeAction': 'Закрыть тикет',
    'tickets.reopenAction': 'Переоткрыть тикет',
    'tickets.deleteTicket': 'Удалить тикет',
    'tickets.confirmDelete': 'Вы уверены, что хотите удалить этот тикет навсегда? Это действие удалит все сообщения и не может быть отменено.',
    'tickets.deletedSuccess': 'Тикет успешно удален',
    'tickets.ticketDeletedAlert': 'Тикет удален',
    'tickets.pressCtrlEnter': 'Ctrl+Enter для отправки'
  }
};

for (const [lang, keys] of Object.entries(translations)) {
  const p = path.join(localesDir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(data, keys);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
console.log('✅ Updated all locales with missing tickets keys.');
