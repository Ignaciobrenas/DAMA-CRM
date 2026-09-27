const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../client/src/i18n/locales');

const exportTranslations = {
  "expenses.exportPdfSuccess": {
    es: "Informe de gastos PDF generado correctamente",
    ca: "Informe de despeses en PDF generat correctament",
    en: "Expenses PDF report generated successfully",
    fr: "Rapport de dépenses PDF généré avec succès",
    de: "Ausgaben-PDF-Bericht erfolgreich erstellt",
    it: "Report spese in PDF generato con successo",
    pt: "Relatório de despesas em PDF gerado com sucesso",
    ar: "تم إنشاء تقرير النفقات بصيغة PDF بنجاح",
    zh: "费用支出 PDF 报表生成成功",
    ja: "経費PDFレポートが正常に生成されました",
    ru: "PDF-отчет по расходам успешно сформирован"
  },
  "tickets.exportSuccess": {
    es: "Tickets exportados correctamente a Excel/CSV",
    ca: "Tiquets exportats correctament a Excel/CSV",
    en: "Tickets exported successfully to Excel/CSV",
    fr: "Tickets exportés avec succès vers Excel/CSV",
    de: "Tickets erfolgreich nach Excel/CSV exportiert",
    it: "Ticket esportati con successo in Excel/CSV",
    pt: "Chamados exportados com sucesso para Excel/CSV",
    ar: "تم تصدير التذاكر بنجاح إلى Excel/CSV",
    zh: "工单已成功导出至 Excel/CSV",
    ja: "チケットがExcel/CSVに正常にエクスポートされました",
    ru: "Тикеты успешно экспортированы в Excel/CSV"
  },
  "tickets.exportPdfSuccess": {
    es: "Informe PDF de tickets generado correctamente",
    ca: "Informe PDF de tiquets generat correctament",
    en: "Tickets PDF report generated successfully",
    fr: "Rapport de tickets PDF généré avec succès",
    de: "Ticket-PDF-Bericht erfolgreich erstellt",
    it: "Report ticket in PDF generato con successo",
    pt: "Relatório de chamados em PDF gerado com sucesso",
    ar: "تم إنشاء تقرير التذاكر بصيغة PDF بنجاح",
    zh: "工单 PDF 报告生成成功",
    ja: "チケットPDFレポートが正常に生成されました",
    ru: "PDF-отчет по тикетам успешно сформирован"
  },
  "tickets.exportError": {
    es: "Error al exportar los tickets",
    ca: "Error en exportar els tiquets",
    en: "Error exporting tickets",
    fr: "Erreur lors de l'exportation des tickets",
    de: "Fehler beim Exportieren der Tickets",
    it: "Errore durante l'esportazione dei ticket",
    pt: "Erro ao exportar chamados",
    ar: "خطأ أثناء تصدير التذاكر",
    zh: "导出工单失败",
    ja: "チケットのエクスポート中にエラーが発生しました",
    ru: "Ошибка при экспорте тикетов"
  },
  "timeTracking.exportPdfSuccess": {
    es: "Informe oficial de jornada en PDF generado correctamente",
    ca: "Informe oficial de jornada en PDF generat correctament",
    en: "Official worktime PDF report generated successfully",
    fr: "Rapport officiel de temps de travail PDF généré avec succès",
    de: "Offizieller Arbeitszeit-PDF-Bericht erfolgreich erstellt",
    it: "Report ufficiale presenze in PDF generato con successo",
    pt: "Relatório oficial de jornada em PDF gerado com sucesso",
    ar: "تم إنشاء التقرير الرسمي لساعات العمل بصيغة PDF بنجاح",
    zh: "法定工时考勤 PDF 报告生成成功",
    ja: "公式就業記録PDFレポートが正常に生成されました",
    ru: "Официальный отчет учета рабочего времени в PDF успешно сформирован"
  },
  "timeTracking.exportError": {
    es: "Error al exportar los registros de jornada",
    ca: "Error en exportar els registres de jornada",
    en: "Error exporting time tracking records",
    fr: "Erreur lors de l'exportation des temps de travail",
    de: "Fehler beim Exportieren der Arbeitszeitaufzeichnungen",
    it: "Errore durante l'esportazione dei registri presenze",
    pt: "Erro ao exportar registros de ponto",
    ar: "خطأ أثناء تصدير سجلات الحضور وساعات العمل",
    zh: "导出考勤工时记录失败",
    ja: "勤務記録のエクスポート中にエラーが発生しました",
    ru: "Ошибка при экспорте записей рабочего времени"
  }
};

const languages = ['ar', 'ca', 'de', 'en', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'];

languages.forEach((lang) => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  let addedCount = 0;
  for (const [key, translations] of Object.entries(exportTranslations)) {
    if (!data[key]) {
      data[key] = translations[lang] || translations['en'] || translations['es'];
      addedCount++;
    }
  }

  // Sort keys alphabetically for strict consistency
  const sortedData = Object.keys(data)
    .sort()
    .reduce((acc, k) => {
      acc[k] = data[k];
      return acc;
    }, {});

  fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  console.log(`Updated ${lang}.json (+${addedCount} keys) - Total keys: ${Object.keys(sortedData).length}`);
});

console.log('Done adding export translation keys!');
