// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DAMA-CRM Documentación',
  tagline: 'CRM Modular Open-Source y Self-Hosted para PYMES',
  favicon: 'img/favicon.ico',
  url: 'https://docs.dama-crm.local',
  baseUrl: '/',
  organizationName: 'Ignacio',
  projectName: 'dama-crm',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'DAMA-CRM Docs',
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Guía de Inicio',
          },
          {
            type: 'doc',
            docId: 'api-reference',
            position: 'left',
            label: 'Referencia API',
          },
          {
            type: 'doc',
            docId: 'zero-cost-deployment',
            position: 'left',
            label: 'Despliegue Zero-Cost',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Ignacio. Licenciado bajo MIT. Construido con Docusaurus.`,
      },
    }),
};

module.exports = config;
