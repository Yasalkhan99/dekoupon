# Import a data-only dump created by supabase-export-data.ps1 into the DESTINATION project.
# Requires: PostgreSQL client tools (psql) on PATH.
# Destination tables must already exist (run supabase-all-tables.sql first) and usually be empty.
#
#   $env:SUPABASE_DEST_DATABASE_URL = "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
#   .\scripts\supabase-import-data.ps1
#
# Or:
#   .\scripts\supabase-import-data.ps1 -DestUrl "postgresql://..." -DumpFile "supabase_data_dump.sql"

param(
  [string]$DestUrl = $env:SUPABASE_DEST_DATABASE_URL,
  [string]$DumpFile = "supabase_data_dump.sql"
)

$ErrorActionPreference = "Stop"

if (-not $DestUrl) {
  Write-Error "Set SUPABASE_DEST_DATABASE_URL or pass -DestUrl (postgresql://...)"
}
if (-not (Test-Path -LiteralPath $DumpFile)) {
  Write-Error "Dump file not found: $DumpFile"
}

Write-Host "Importing $DumpFile ..."
& psql $DestUrl -f $DumpFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done."
