const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../client/src/i18n/locales');

const exportTranslations = {
  "agile.exportCsvSuccess": {
    es: "Proyectos y tareas exportados a Excel correctamente",
    ca: "Projectes i tasques exportats a Excel correctament",
    en: "Projects and tasks exported to Excel successfully",
    fr: "Projets et tâches exportés vers Excel avec succès",
    de: "Projekte und Aufgaben erfolgreich nach Excel exportiert",
    it: "Progetti e attività esportati con successo in Excel",
    pt: "Projetos e tarefas exportados para Excel com sucesso",
    ar: "تم تصدير المشاريع والمهام إلى Excel بنجاح",
    zh: "项目与任务已成功导出至 Excel",
    ja: "プロジェクトとタスクがExcelに正常にエクスポートされました",
    ru: "Проекты и задачи успешно экспортированы в Excel"
  },
  "agile.exportPdfSuccess": {
    es: "Informe PDF de proyectos generado correctamente",
    ca: "Informe PDF de projectes generat correctament",
    en: "Projects PDF report generated successfully",
    fr: "Rapport PDF des projets généré avec succès",
    de: "Projekt-PDF-Bericht erfolgreich erstellt",
    it: "Report progetti in PDF generato con successo",
    pt: "Relatório de projetos em PDF gerado com sucesso",
    ar: "تم إنشاء تقرير المشاريع بصيغة PDF بنجاح",
    zh: "敏捷项目 PDF 报告生成成功",
    ja: "プロジェクトPDFレポートが正常に生成されました",
    ru: "PDF-отчет по проектам успешно сформирован"
  },
  "agile.exportError": {
    es: "Error al exportar los proyectos",
    ca: "Error en exportar els projectes",
    en: "Error exporting projects",
    fr: "Erreur lors de l'exportation des projets",
    de: "Fehler beim Exportieren der Projekte",
    it: "Errore durante l'esportazione dei progetti",
    pt: "Erro ao exportar projetos",
    ar: "خطأ أثناء تصدير المشاريع",
    zh: "导出项目失败",
    ja: "プロジェクトのエクスポート中にエラーが発生しました",
    ru: "Ошибка при экспорте проектов"
  },
  "pipeline.exportCsvSuccess": {
    es: "Pipeline de ventas exportado a Excel correctamente",
    ca: "Pipeline de vendes exportat a Excel correctament",
    en: "Sales pipeline exported to Excel successfully",
    fr: "Pipeline des ventes exporté vers Excel avec succès",
    de: "Vertriebs-Pipeline erfolgreich nach Excel exportiert",
    it: "Pipeline di vendita esportata con successo in Excel",
    pt: "Pipeline de vendas exportado para Excel com sucesso",
    ar: "تم تصدير مسار المبيعات إلى Excel بنجاح",
    zh: "销售商机漏斗已成功导出至 Excel",
    ja: "営業パイプラインがExcelに正常にエクスポートされました",
    ru: "Воронка продаж успешно экспортирована в Excel"
  },
  "pipeline.exportPdfSuccess": {
    es: "Informe PDF del pipeline generado correctamente",
    ca: "Informe PDF del pipeline generat correctament",
    en: "Pipeline PDF report generated successfully",
    fr: "Rapport PDF du pipeline généré avec succès",
    de: "Pipeline-PDF-Bericht erfolgreich erstellt",
    it: "Report pipeline in PDF generato con successo",
    pt: "Relatório do pipeline em PDF gerado com sucesso",
    ar: "تم إنشاء تقرير مسار المبيعات بصيغة PDF بنجاح",
    zh: "销售商机漏斗 PDF 报告生成成功",
    ja: "パイプラインPDFレポートが正常に生成されました",
    ru: "PDF-отчет по воронке продаж успешно сформирован"
  },
  "pipeline.exportError": {
    es: "Error al exportar el pipeline comercial",
    ca: "Error en exportar el pipeline comercial",
    en: "Error exporting sales pipeline",
    fr: "Erreur lors de l'exportation du pipeline commercial",
    de: "Fehler beim Exportieren der Vertriebs-Pipeline",
    it: "Errore durante l'esportazione della pipeline",
    pt: "Erro ao exportar pipeline comercial",
    ar: "خطأ أثناء تصدير مسار المبيعات",
    zh: "导出商机漏斗失败",
    ja: "パイプラインのエクスポート中にエラーが発生しました",
    ru: "Ошибка при экспорте воронки продаж"
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

  const sortedData = Object.keys(data)
    .sort()
    .reduce((acc, k) => {
      acc[k] = data[k];
      return acc;
    }, {});

  fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
  console.log(`Updated ${lang}.json (+${addedCount} keys) - Total keys: ${Object.keys(sortedData).length}`);
});

console.log('Done adding agile and pipeline export keys!');
