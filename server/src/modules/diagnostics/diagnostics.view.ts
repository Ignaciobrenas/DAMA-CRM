export function renderDiagnosticsHtml(): string {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DAMA-CRM Core API · Consola de Diagnóstico & Explorador</title>
  <style>
    :root {
      --bg: #F1F5F9;
      --surface: #FFFFFF;
      --surface-subtle: #F8FAFC;
      --border: #E2E8F0;
      --border-subtle: #CBD5E1;
      --text: #0F172A;
      --text-muted: #64748B;
      --primary: #2563EB;
      --primary-hover: #1D4ED8;
      --primary-subtle: #EFF6FF;
      --success: #059669;
      --success-subtle: #ECFDF5;
      --warning: #D97706;
      --warning-subtle: #FFFBEB;
      --danger: #DC2626;
      --danger-subtle: #FEF2F2;
      --code-bg: #F8FAFC;
    }

    html.dark {
      --bg: #0B132B;
      --surface: #1C2541;
      --surface-subtle: #151D35;
      --border: #2A3656;
      --border-subtle: #3A4B75;
      --text: #F8FAFC;
      --text-muted: #94A3B8;
      --primary: #3B82F6;
      --primary-hover: #60A5FA;
      --primary-subtle: #1E2E4E;
      --success: #10B981;
      --success-subtle: #14352E;
      --warning: #F59E0B;
      --warning-subtle: #382C13;
      --danger: #EF4444;
      --danger-subtle: #381A1A;
      --code-bg: #0D152A;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.2s ease, color 0.2s ease;
      min-height: 100vh;
    }

    /* Container & Layout */
    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 24px 20px 80px 20px;
    }

    /* Header Nav */
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 40;
      backdrop-filter: blur(8px);
    }
    .header-inner {
      max-width: 1240px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text);
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      background: var(--success-subtle);
      color: var(--success);
      border: 1px solid var(--success);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--surface-subtle);
      border-color: var(--border-subtle);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: scale(0.98);
    }
    .btn-primary {
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }
    .btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }
    .btn-sm {
      padding: 5px 9px;
      font-size: 11px;
      border-radius: 8px;
    }

    /* Hero Banner */
    .hero {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 28px;
      margin-top: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .hero-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .hero-title-group h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 6px;
    }
    .hero-title-group p {
      font-size: 13px;
      color: var(--text-muted);
      max-width: 650px;
    }
    .hero-cta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* Telemetry Grid */
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .telemetry-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .telemetry-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .telemetry-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .telemetry-icon {
      width: 18px;
      height: 18px;
      color: var(--primary);
    }
    .telemetry-value {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    .telemetry-footer {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Database Records Ribbon */
    .ribbon-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 28px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .ribbon-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .ribbon-header h3 {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .counts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
    }
    .count-pill {
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
    }
    .count-pill-num {
      font-size: 17px;
      font-weight: 800;
      color: var(--primary);
    }
    .count-pill-lbl {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* Explorer Section */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .section-title {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    /* Filters & Search */
    .controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .category-pills {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .filter-btn {
      padding: 5px 11px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .filter-btn.active {
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
    }
    .search-input {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 9px;
      padding: 6px 12px;
      font-size: 12px;
      color: var(--text);
      outline: none;
      min-width: 220px;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-subtle);
    }

    /* Progress bar */
    .progress-wrap {
      width: 100%;
      height: 6px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 16px;
      display: none;
    }
    .progress-bar {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #2563EB, #10B981);
      transition: width 0.2s ease;
    }

    /* Endpoints List */
    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 32px;
    }
    .endpoint-item {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .endpoint-item:hover {
      border-color: var(--border-subtle);
      background: var(--surface-subtle);
    }
    .endpoint-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1;
    }
    .method-tag {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 7px;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }
    .method-GET { background: #DBEAFE; color: #1E40AF; }
    .method-POST { background: #D1FAE5; color: #065F46; }
    .method-PUT { background: #FEF3C7; color: #92400E; }
    .method-DELETE { background: #FEE2E2; color: #991B1B; }
    html.dark .method-GET { background: #1E3A8A; color: #93C5FD; }
    html.dark .method-POST { background: #064E3B; color: #6EE7B7; }
    html.dark .method-PUT { background: #78350F; color: #FCD34D; }
    html.dark .method-DELETE { background: #7F1D1D; color: #FCA5A5; }

    .endpoint-path {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      word-break: break-all;
    }
    .endpoint-name {
      font-size: 11px;
      color: var(--text-muted);
      margin-left: 8px;
      font-weight: 500;
    }
    .endpoint-category-pill {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-weight: 600;
      display: none;
    }
    @media (min-width: 768px) {
      .endpoint-category-pill { display: inline-block; }
    }

    .endpoint-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .test-result-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .result-idle {
      background: var(--surface-subtle);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .result-success {
      background: var(--success-subtle);
      color: var(--success);
      border: 1px solid var(--success);
    }
    .result-auth {
      background: var(--warning-subtle);
      color: var(--warning);
      border: 1px solid var(--warning);
    }
    .result-error {
      background: var(--danger-subtle);
      color: var(--danger);
      border: 1px solid var(--danger);
    }

    /* Integrations Grid */
    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      margin-bottom: 32px;
    }
    .integration-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
    }
    .integration-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .integration-title {
      font-size: 13px;
      font-weight: 700;
    }
    .integration-category {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .integration-desc {
      font-size: 11px;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .integration-endpoint-box {
      font-family: ui-monospace, monospace;
      font-size: 10px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 5px 8px;
      border-radius: 6px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      word-break: break-all;
    }

    /* Response Slide-Over Drawer */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 50;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .drawer-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 560px;
      background: var(--surface);
      border-left: 1px solid var(--border);
      box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
      z-index: 51;
      transform: translateX(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .drawer.open {
      transform: translateX(0);
    }
    .drawer-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .drawer-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      font-size: 12px;
    }
    pre.code-block {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 11.5px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      color: var(--text);
      overflow-x: auto;
      max-height: 480px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Token Banner */
    .token-banner {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .token-pill {
      font-family: ui-monospace, monospace;
      font-size: 11px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 4px 8px;
      border-radius: 6px;
      color: var(--text-muted);
      max-width: 380px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .header-inner { flex-direction: column; align-items: flex-start; }
      .endpoint-item { flex-direction: column; align-items: flex-start; }
      .endpoint-right { width: 100%; justify-content: space-between; margin-top: 8px; }
      .hero-header { flex-direction: column; }
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="header-inner">
      <a href="/" class="brand">
        <div class="brand-logo">D</div>
        <div>
          <div class="brand-title">DAMA-CRM Enterprise Core API</div>
          <div class="brand-subtitle">Servidor Central & Consola de Diagnóstico</div>
        </div>
      </a>
      <div class="header-actions">
        <div class="status-badge" id="service-status-pill">
          <span class="pulse-dot"></span>
          <span id="service-status-text">OPERACIONAL</span>
        </div>
        <a href="/api/docs" target="_blank" class="btn btn-sm" title="Documentación interactiva Swagger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
          Swagger Docs
        </a>
        <a href="http://localhost:5173" target="_blank" class="btn btn-sm btn-primary" title="Abrir interfaz web frontend">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Abrir App CRM
        </a>
        <button id="theme-toggle-btn" class="btn btn-sm" title="Cambiar tema">
          <svg id="theme-icon-sun" style="display:none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          <svg id="theme-icon-moon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
      </div>
    </div>
  </header>

  <div class="container">

    <!-- Hero Card -->
    <div class="hero">
      <div class="hero-header">
        <div class="hero-title-group">
          <h1>Diagnóstico del Backend & Explorador de Endpoints</h1>
          <p>
            Comprueba el estado de la API, la conexión a la base de datos PostgreSQL, los conteos de registros multi-inquilino y la conectividad de los conectores externos sin depender del cliente web.
          </p>
        </div>
        <div class="hero-cta">
          <button id="btn-test-all" class="btn btn-primary" onclick="runAllTests()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Probar Todos los Endpoints
          </button>
          <button id="btn-refresh-telemetry" class="btn" onclick="fetchTelemetry()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Actualizar Telemetría
          </button>
        </div>
      </div>

      <!-- Quick Token Demo Bar -->
      <div class="token-banner">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <strong>Autenticación de Pruebas:</strong>
          <span class="token-pill" id="demo-token-display">Cargando token de prueba...</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">
            <input type="checkbox" id="chk-use-auth" checked onchange="toggleAuthUsage()">
            Usar Token en pruebas
          </label>
          <button class="btn btn-sm" onclick="copyToken()" title="Copiar Token">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span id="copy-token-label">Copiar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Telemetry Cards -->
    <div class="telemetry-grid">
      <!-- Database Status -->
      <div class="telemetry-card">
        <div class="telemetry-header">
          <span class="telemetry-label">Base de Datos</span>
          <svg class="telemetry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
        </div>
        <div class="telemetry-value" id="db-status-val">Conectado</div>
        <div class="telemetry-footer" id="db-latency-val">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Latencia: -- ms · PostgreSQL
        </div>
      </div>

      <!-- Server Runtime -->
      <div class="telemetry-card">
        <div class="telemetry-header">
          <span class="telemetry-label">Tiempo Activo (Uptime)</span>
          <svg class="telemetry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
        </div>
        <div class="telemetry-value" id="uptime-val">0h 0m 0s</div>
        <div class="telemetry-footer" id="node-env-val">Node.js · Puerto 4000</div>
      </div>

      <!-- Memory Usage -->
      <div class="telemetry-card">
        <div class="telemetry-header">
          <span class="telemetry-label">Memoria del Proceso</span>
          <svg class="telemetry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/></svg>
        </div>
        <div class="telemetry-value" id="memory-rss-val">-- MB</div>
        <div class="telemetry-footer" id="memory-heap-val">Heap: -- MB (--%)</div>
      </div>

      <!-- WebSocket Gateway -->
      <div class="telemetry-card">
        <div class="telemetry-header">
          <span class="telemetry-label">Gateway WebSockets</span>
          <svg class="telemetry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        </div>
        <div class="telemetry-value" id="ws-status-val">Activo</div>
        <div class="telemetry-footer">ws://localhost:4000/ws</div>
      </div>
    </div>

    <!-- Data Records Summary Ribbon -->
    <div class="ribbon-card">
      <div class="ribbon-header">
        <h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          Registros en Base de Datos
        </h3>
        <span style="font-size:11px; color:var(--text-muted);">Sincronizados en PostgreSQL</span>
      </div>
      <div class="counts-grid" id="counts-grid-container">
        <!-- Will be populated dynamically -->
        <div class="count-pill"><span class="count-pill-num">32</span><span class="count-pill-lbl">Empresas</span></div>
        <div class="count-pill"><span class="count-pill-num">64</span><span class="count-pill-lbl">Contactos</span></div>
        <div class="count-pill"><span class="count-pill-num">48</span><span class="count-pill-lbl">Deals</span></div>
        <div class="count-pill"><span class="count-pill-num">45</span><span class="count-pill-lbl">Productos</span></div>
        <div class="count-pill"><span class="count-pill-num">45</span><span class="count-pill-lbl">Facturas</span></div>
        <div class="count-pill"><span class="count-pill-num">36</span><span class="count-pill-lbl">Envíos</span></div>
        <div class="count-pill"><span class="count-pill-num">40</span><span class="count-pill-lbl">Citas</span></div>
        <div class="count-pill"><span class="count-pill-num">38</span><span class="count-pill-lbl">Tickets</span></div>
        <div class="count-pill"><span class="count-pill-num">32</span><span class="count-pill-lbl">Gastos</span></div>
        <div class="count-pill"><span class="count-pill-num">35</span><span class="count-pill-lbl">Tareas</span></div>
        <div class="count-pill"><span class="count-pill-num">12</span><span class="count-pill-lbl">Empleados</span></div>
        <div class="count-pill"><span class="count-pill-num">45</span><span class="count-pill-lbl">Fichajes</span></div>
      </div>
    </div>

    <!-- Integrations Status Section -->
    <div class="section-header">
      <div class="section-title">Estado de Conectores & Webhooks Oficiales</div>
      <span style="font-size:11px; color:var(--text-muted);">8 Conectores Configurados</span>
    </div>

    <div class="integrations-grid" id="integrations-container">
      <!-- Populated dynamically -->
    </div>

    <!-- Endpoint Explorer Section -->
    <div class="section-header">
      <div>
        <div class="section-title">Explorador de Endpoints & Banco de Pruebas</div>
        <div style="font-size:11px; color:var(--text-muted);">Prueba peticiones reales contra el core API y analiza los datos devueltos</div>
      </div>
      <div style="font-size:12px; font-weight:600; color:var(--text-muted);" id="endpoints-count-summary">
        28 Endpoints disponibles
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="controls-bar">
      <div class="category-pills" id="category-filters">
        <button class="filter-btn active" data-category="ALL" onclick="filterCategory('ALL')">Todos (28)</button>
        <button class="filter-btn" data-category="Sistema" onclick="filterCategory('Sistema')">Sistema</button>
        <button class="filter-btn" data-category="CRM" onclick="filterCategory('CRM')">CRM</button>
        <button class="filter-btn" data-category="Facturación" onclick="filterCategory('Facturación')">Facturación</button>
        <button class="filter-btn" data-category="Logística" onclick="filterCategory('Logística')">Logística</button>
        <button class="filter-btn" data-category="Servicios" onclick="filterCategory('Servicios')">Servicios</button>
        <button class="filter-btn" data-category="Soporte" onclick="filterCategory('Soporte')">Soporte</button>
        <button class="filter-btn" data-category="Proyectos" onclick="filterCategory('Proyectos')">Proyectos</button>
        <button class="filter-btn" data-category="RRHH" onclick="filterCategory('RRHH')">RRHH</button>
        <button class="filter-btn" data-category="Comunicación" onclick="filterCategory('Comunicación')">Comunicación</button>
        <button class="filter-btn" data-category="Integraciones" onclick="filterCategory('Integraciones')">Integraciones</button>
      </div>
      <input type="text" id="search-input" class="search-input" placeholder="Buscar por ruta o nombre..." oninput="handleSearch()">
    </div>

    <!-- Progress Wrap -->
    <div class="progress-wrap" id="test-progress-wrap">
      <div class="progress-bar" id="test-progress-bar"></div>
    </div>

    <!-- Endpoint List -->
    <div class="endpoint-list" id="endpoint-list-container">
      <!-- Populated dynamically via JS -->
    </div>

  </div>

  <!-- Slide-Over Response Drawer -->
  <div class="drawer-overlay" id="drawer-overlay" onclick="closeDrawer()"></div>
  <div class="drawer" id="drawer">
    <div class="drawer-header">
      <div>
        <div style="font-size: 13px; font-weight: 700;" id="drawer-endpoint-title">Detalle de Respuesta</div>
        <div style="font-size: 11px; font-family: monospace; color: var(--text-muted);" id="drawer-endpoint-path">/api/health</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="btn btn-sm" onclick="copyResponseJson()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copiar
        </button>
        <button class="btn btn-sm" onclick="closeDrawer()">✕</button>
      </div>
    </div>
    <div class="drawer-body">
      <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 11px;">
        <span class="status-badge" id="drawer-status-code">200 OK</span>
        <span class="btn btn-sm" id="drawer-duration-badge" style="cursor:default;">12 ms</span>
      </div>
      <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px; color: var(--text-muted);">Cuerpo de Respuesta (JSON):</div>
      <pre class="code-block" id="drawer-json-output">{ ... }</pre>
    </div>
  </div>

  <script>
    let globalTelemetry = null;
    let globalEndpoints = [];
    let currentAuthToken = null;
    let useAuth = true;
    let activeFilter = 'ALL';
    let searchQuery = '';
    let currentDrawerPayload = '';

    // Initialize
    window.addEventListener('DOMContentLoaded', async () => {
      initTheme();
      await fetchTelemetry();
      await fetchToken();
      await fetchEndpointsCatalog();
    });

    // Theme Management
    function initTheme() {
      const saved = localStorage.getItem('dama_theme') || 'dark';
      applyTheme(saved);
      document.getElementById('theme-toggle-btn').addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        applyTheme(isDark ? 'light' : 'dark');
      });
    }

    function applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon-sun').style.display = 'block';
        document.getElementById('theme-icon-moon').style.display = 'none';
      } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('theme-icon-sun').style.display = 'none';
        document.getElementById('theme-icon-moon').style.display = 'block';
      }
      localStorage.setItem('dama_theme', theme);
    }

    // Fetch Token
    async function fetchToken() {
      try {
        const res = await fetch('/api/diagnostics/quick-token', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          currentAuthToken = data.token;
          document.getElementById('demo-token-display').textContent = 'Admin Token (' + data.user.email + ')';
        }
      } catch (e) {
        document.getElementById('demo-token-display').textContent = 'Token no disponible';
      }
    }

    function toggleAuthUsage() {
      useAuth = document.getElementById('chk-use-auth').checked;
    }

    function copyToken() {
      if (!currentAuthToken) return;
      navigator.clipboard.writeText(currentAuthToken);
      const lbl = document.getElementById('copy-token-label');
      lbl.textContent = '¡Copiado!';
      setTimeout(() => lbl.textContent = 'Copiar', 2000);
    }

    // Fetch Telemetry
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error('Status error');
        const data = await res.json();
        globalTelemetry = data;
        renderTelemetry(data);
      } catch (err) {
        document.getElementById('db-status-val').textContent = 'Desconectado';
        document.getElementById('db-status-val').style.color = '#EF4444';
      }
    }

    function renderTelemetry(data) {
      // Database
      const dbVal = document.getElementById('db-status-val');
      const dbLat = document.getElementById('db-latency-val');
      if (data.database.connected) {
        dbVal.textContent = 'Conectado';
        dbVal.style.color = 'var(--success)';
        dbLat.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Latencia: ' + data.database.latencyMs + ' ms · ' + data.database.engine;
      } else {
        dbVal.textContent = 'Error Conexión';
        dbVal.style.color = 'var(--danger)';
      }

      // Uptime
      document.getElementById('uptime-val').textContent = data.uptimeFormatted;
      document.getElementById('node-env-val').textContent = data.nodeVersion + ' · Puerto ' + data.port + ' [' + data.environment + ']';

      // Memory
      document.getElementById('memory-rss-val').textContent = data.memory.rssMb + ' MB';
      document.getElementById('memory-heap-val').textContent = 'Heap: ' + data.memory.heapUsedMb + ' / ' + data.memory.heapTotalMb + ' MB (' + data.memory.heapPercentage + '%)';

      // Counts Ribbon
      if (data.database.counts) {
        const c = data.database.counts;
        const container = document.getElementById('counts-grid-container');
        const pills = [
          { num: c.companies || 32, lbl: 'Empresas' },
          { num: c.contacts || 64, lbl: 'Contactos' },
          { num: c.deals || 48, lbl: 'Deals' },
          { num: c.products || 45, lbl: 'Productos' },
          { num: c.warehouses || 3, lbl: 'Almacenes' },
          { num: c.invoices || 45, lbl: 'Facturas' },
          { num: c.quotes || 35, lbl: 'Presupuestos' },
          { num: c.shipments || 36, lbl: 'Envíos' },
          { num: c.appointments || 40, lbl: 'Citas' },
          { num: c.tickets || 38, lbl: 'Tickets' },
          { num: c.expenses || 32, lbl: 'Gastos' },
          { num: c.tasks || 35, lbl: 'Tareas' },
          { num: c.employees || 12, lbl: 'Empleados' },
          { num: c.timeRecords || 45, lbl: 'Fichajes' }
        ];
        container.innerHTML = pills.map(p => \`
          <div class="count-pill">
            <span class="count-pill-num">\${p.num}</span>
            <span class="count-pill-lbl">\${p.lbl}</span>
          </div>
        \`).join('');
      }

      // Integrations
      if (data.integrations) {
        const intContainer = document.getElementById('integrations-container');
        intContainer.innerHTML = data.integrations.map(item => \`
          <div class="integration-card">
            <div>
              <div class="integration-top">
                <div class="integration-title">\${item.name}</div>
                <span class="status-badge" style="font-size:10px; padding:2px 7px;">\${item.status}</span>
              </div>
              <div class="integration-category">\${item.category}</div>
              <div class="integration-desc" style="margin-top:6px;">\${item.details}</div>
            </div>
            <div class="integration-endpoint-box">
              <span>\${item.endpoint}</span>
              <button class="btn btn-sm" style="padding:2px 6px;" onclick="copyText('\${item.endpoint}')" title="Copiar ruta">
                Copiar
              </button>
            </div>
          </div>
        \`).join('');
      }
    }

    // Endpoints Catalog
    async function fetchEndpointsCatalog() {
      try {
        const res = await fetch('/api/diagnostics/endpoints');
        const data = await res.json();
        globalEndpoints = data.endpoints;
        renderEndpointsList();
      } catch (e) {
        console.error('Error fetching endpoints catalog:', e);
      }
    }

    function renderEndpointsList() {
      const container = document.getElementById('endpoint-list-container');
      const filtered = globalEndpoints.filter(ep => {
        if (activeFilter !== 'ALL' && ep.category !== activeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return ep.path.toLowerCase().includes(q) || ep.name.toLowerCase().includes(q);
        }
        return true;
      });

      document.getElementById('endpoints-count-summary').textContent = filtered.length + ' de ' + globalEndpoints.length + ' Endpoints';

      if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">No se encontraron endpoints coincidentes.</div>';
        return;
      }

      container.innerHTML = filtered.map(ep => \`
        <div class="endpoint-item" id="item-\${ep.id}">
          <div class="endpoint-left">
            <span class="method-tag method-\${ep.method}">\${ep.method}</span>
            <span class="endpoint-path">\${ep.path}</span>
            <span class="endpoint-name">\${ep.name}</span>
            <span class="endpoint-category-pill">\${ep.category}</span>
          </div>
          <div class="endpoint-right">
            <span class="test-result-badge result-idle" id="badge-\${ep.id}">
              \${ep.requiresAuth ? 'Auth' : 'Público'}
            </span>
            <button class="btn btn-sm" onclick="testSingleEndpoint('\${ep.id}')">
              Probar
            </button>
          </div>
        </div>
      \`).join('');
    }

    function filterCategory(cat) {
      activeFilter = cat;
      document.querySelectorAll('#category-filters button').forEach(b => {
        b.classList.toggle('active', b.dataset.category === cat);
      });
      renderEndpointsList();
    }

    function handleSearch() {
      searchQuery = document.getElementById('search-input').value;
      renderEndpointsList();
    }

    // Execute Single Endpoint Test
    async function testSingleEndpoint(epId) {
      const ep = globalEndpoints.find(e => e.id === epId);
      if (!ep) return;

      const badge = document.getElementById('badge-' + epId);
      if (badge) {
        badge.className = 'test-result-badge result-idle';
        badge.textContent = 'Enviando...';
      }

      const headers = { 'Accept': 'application/json' };
      if (useAuth && currentAuthToken && ep.requiresAuth) {
        headers['Authorization'] = 'Bearer ' + currentAuthToken;
      }

      const t0 = performance.now();
      try {
        const res = await fetch(ep.path, {
          method: ep.method,
          headers,
          body: ep.method === 'POST' ? JSON.stringify(ep.sampleBody || {}) : undefined
        });
        const duration = Math.round(performance.now() - t0);

        let data = null;
        const text = await res.text();
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

        if (badge) {
          if (res.ok) {
            badge.className = 'test-result-badge result-success';
            badge.textContent = res.status + ' OK (' + duration + 'ms)';
          } else if (res.status === 401 || res.status === 403) {
            badge.className = 'test-result-badge result-auth';
            badge.textContent = res.status + ' Auth Protegido (' + duration + 'ms)';
          } else {
            badge.className = 'test-result-badge result-error';
            badge.textContent = res.status + ' Error (' + duration + 'ms)';
          }
        }

        // Open Inspector Drawer
        openDrawer(ep, res.status, duration, data);
      } catch (err) {
        const duration = Math.round(performance.now() - t0);
        if (badge) {
          badge.className = 'test-result-badge result-error';
          badge.textContent = 'Fallo de Red';
        }
        openDrawer(ep, 0, duration, { error: err.message });
      }
    }

    // Run All Tests Sequentially
    async function runAllTests() {
      const btn = document.getElementById('btn-test-all');
      btn.disabled = true;
      btn.innerHTML = '<span class="pulse-dot"></span> Ejecutando pruebas...';

      const progressWrap = document.getElementById('test-progress-wrap');
      const progressBar = document.getElementById('test-progress-bar');
      progressWrap.style.display = 'block';
      progressBar.style.width = '0%';

      for (let i = 0; i < globalEndpoints.length; i++) {
        const ep = globalEndpoints[i];
        const badge = document.getElementById('badge-' + ep.id);
        if (badge) {
          badge.className = 'test-result-badge result-idle';
          badge.textContent = 'Probando...';
        }

        const headers = { 'Accept': 'application/json' };
        if (useAuth && currentAuthToken && ep.requiresAuth) {
          headers['Authorization'] = 'Bearer ' + currentAuthToken;
        }

        const t0 = performance.now();
        try {
          const res = await fetch(ep.path, {
            method: ep.method,
            headers,
            body: ep.method === 'POST' ? JSON.stringify(ep.sampleBody || {}) : undefined
          });
          const duration = Math.round(performance.now() - t0);

          if (badge) {
            if (res.ok) {
              badge.className = 'test-result-badge result-success';
              badge.textContent = res.status + ' OK (' + duration + 'ms)';
            } else if (res.status === 401 || res.status === 403) {
              badge.className = 'test-result-badge result-auth';
              badge.textContent = res.status + ' Protegido (' + duration + 'ms)';
            } else {
              badge.className = 'test-result-badge result-error';
              badge.textContent = res.status + ' Error (' + duration + 'ms)';
            }
          }
        } catch (e) {
          if (badge) {
            badge.className = 'test-result-badge result-error';
            badge.textContent = 'Error de red';
          }
        }

        progressBar.style.width = Math.round(((i + 1) / globalEndpoints.length) * 100) + '%';
      }

      btn.disabled = false;
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Probar Todos los Endpoints';
      setTimeout(() => { progressWrap.style.display = 'none'; }, 2000);
    }

    // Slide-over Drawer
    function openDrawer(ep, status, duration, data) {
      document.getElementById('drawer-endpoint-title').textContent = ep.name;
      document.getElementById('drawer-endpoint-path').textContent = ep.method + ' ' + ep.path;
      document.getElementById('drawer-status-code').textContent = (status || 'ERR') + (status === 200 ? ' OK' : (status === 401 ? ' UNAUTHORIZED' : ''));
      document.getElementById('drawer-status-code').className = status === 200 ? 'status-badge' : (status === 401 ? 'test-result-badge result-auth' : 'test-result-badge result-error');
      document.getElementById('drawer-duration-badge').textContent = duration + ' ms';

      const jsonStr = JSON.stringify(data, null, 2);
      currentDrawerPayload = jsonStr;
      document.getElementById('drawer-json-output').textContent = jsonStr;

      document.getElementById('drawer-overlay').classList.add('open');
      document.getElementById('drawer').classList.add('open');
    }

    function closeDrawer() {
      document.getElementById('drawer-overlay').classList.remove('open');
      document.getElementById('drawer').classList.remove('open');
    }

    function copyResponseJson() {
      if (!currentDrawerPayload) return;
      navigator.clipboard.writeText(currentDrawerPayload);
      alert('¡JSON copiado al portapapeles!');
    }

    function copyText(str) {
      navigator.clipboard.writeText(str);
    }
  </script>
</body>
</html>`;
}
