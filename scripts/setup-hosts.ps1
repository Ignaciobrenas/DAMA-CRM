# ============================================================================
# DAMA-CRM: Configure Windows Hosts file for Multi-Tenant Subdomains
# ============================================================================

$hostsPath = "$env:windir\System32\drivers\etc\hosts"

$domainsToAdd = @(
    "# DAMA-CRM Local Multi-Tenant Domains",
    "127.0.0.1 dama.com",
    "127.0.0.1 god.dama.com",
    "127.0.0.1 app.dama.com",
    "127.0.0.1 ignacio-corp.dama.com",
    "127.0.0.1 demo.dama.com",
    "127.0.0.1 admin.dama.com",
    "127.0.0.1 damacrm.local",
    "127.0.0.1 god.damacrm.local"
)

Write-Host "Verificando archivo hosts..." -ForegroundColor Cyan

$currentContent = Get-Content $hostsPath -Raw

if ($currentContent -match "god\.dama\.com") {
    Write-Host "✓ Los dominios de DAMA-CRM ya están registrados en el archivo hosts." -ForegroundColor Green
} else {
    $entryText = "`r`n`r`n" + ($domainsToAdd -join "`r`n") + "`r`n"
    Add-Content -Path $hostsPath -Value $entryText -Encoding utf8
    Write-Host "✓ Dominios añadidos con éxito al archivo hosts ($hostsPath)." -ForegroundColor Green
}

# Flush DNS cache
Clear-DnsClientCache -ErrorAction SilentlyContinue
Write-Host "✓ Caché DNS de Windows purgada." -ForegroundColor Cyan
Write-Host ""
Write-Host "Puedes acceder a:" -ForegroundColor Yellow
Write-Host "  -> http://god.dama.com" -ForegroundColor White
Write-Host "  -> http://ignacio-corp.dama.com" -ForegroundColor White
Write-Host "  -> http://dama.com" -ForegroundColor White
