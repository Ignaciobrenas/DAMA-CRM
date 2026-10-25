const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'client', 'src', 'index.css');
let content = fs.readFileSync(cssPath, 'utf8');

const target = `/* ==========================================================================
   Modern Anti-Glare Light Theme (Linear / Stripe / Vercel Standards)
   ========================================================================== */
html:not(.dark) {
  --surface-bg: #F1F5F9;
  --surface-card: #FFFFFF;
  --surface-well: #F8FAFC;
  --surface-hover: #F1F5F9;
  --border-subtle: #E2E8F0;
  --border-medium: #CBD5E1;
  --border-strong: #94A3B8;
  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-muted: #64748B;
}`;

const replacement = `/* ==========================================================================
   Modern Anti-Glare Light Theme (Linear / Stripe / Vercel Standards)
   ========================================================================== */
html:not(.dark) {
  --surface-bg: #EEF0F3;
  --surface-canvas: #EEF0F3;
  --surface-sidebar: #F6F7F9;
  --surface-card: #FFFFFF;
  --surface-well: #EEF2F6;
  --surface-hover: #E5E9EE;
  --border-subtle: #D9DDE3;
  --border-medium: #CBD5E1;
  --border-strong: #94A3B8;
  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-muted: #64748B;
  --color-primary-soft: #2563EB;
  --color-success-bg: #D1FAE5;
  --color-success-text: #065F46;
  --color-warning-bg: #FEF3C7;
  --color-warning-text: #92400E;
  --color-danger-bg: #FFE4E6;
  --color-danger-text: #9F1239;
  --color-info-bg: #DBEAFE;
  --color-info-text: #1E40AF;
}`;

// Normalize line endings for replacement
content = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, normalizedReplacement);
}

content = content.replace(/background-color: #F1F5F9 !important;\n  color: #0F172A !important;/, 'background-color: #EEF0F3 !important;\n  color: #0F172A !important;');
content = content.replace(/border-color: #E2E8F0 !important;\n  box-shadow: 0 1px 3px 0 rgba\(15, 23, 42, 0.04\), 0 1px 2px -1px rgba\(15, 23, 42, 0.03\) !important;/, 'border-color: #D9DDE3 !important;\n  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04) !important;');
content = content.replace(/background-color: #F8FAFC !important;\n  border-right: 1px solid #E2E8F0 !important;/, 'background-color: #F6F7F9 !important;\n  border-right: 1px solid #D9DDE3 !important;');
content = content.replace(/border-bottom: 1px solid #E2E8F0 !important;/, 'border-bottom: 1px solid #D9DDE3 !important;');
content = content.replace(/html:not\(\.dark\) \.border-gray-200,\nhtml:not\(\.dark\) \.border-slate-200 {\n  border-color: #E2E8F0 !important;/, 'html:not(.dark) .border-gray-200,\nhtml:not(.dark) .border-slate-200 {\n  border-color: #D9DDE3 !important;');
content = content.replace(/html:not\(\.dark\) \.bg-gray-50,\nhtml:not\(\.dark\) \.bg-slate-50 {\n  background-color: #F8FAFC !important;\n  border-color: #E2E8F0 !important;/, 'html:not(.dark) .bg-gray-50,\nhtml:not(.dark) .bg-slate-50 {\n  background-color: #F6F7F9 !important;\n  border-color: #D9DDE3 !important;');
content = content.replace(/html:not\(\.dark\) \.bg-gray-100,\nhtml:not\(\.dark\) \.bg-slate-100 {\n  background-color: #F1F5F9 !important;\n  border-color: #E2E8F0 !important;/, 'html:not(.dark) .bg-gray-100,\nhtml:not(.dark) .bg-slate-100 {\n  background-color: #EEF0F3 !important;\n  border-color: #D9DDE3 !important;');

fs.writeFileSync(cssPath, content, 'utf8');
console.log('✅ Successfully updated client/src/index.css with refined anti-glare light tokens');
