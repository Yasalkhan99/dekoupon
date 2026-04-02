# Export data-only for public.stores, blog_posts, coupons, coupon_clicks.
# Requires: PostgreSQL client tools (pg_dump) on PATH.
#
# Set your SOURCE project connection string (Project Settings → Database → URI).
# Use the direct connection (port 5432), not the pooler (6543), when possible.
#
#   $env:SUPABASE_SOURCE_DATABASE_URL = "postgresql://postgres.xxx:PASSWORD@aws-0-...pooler.supabase.com:5432/postgres"
#   .\scripts\supabase-export-data.ps1
#
# Or pass explicitly:
#   .\scripts\supabase-export-data.ps1 -SourceUrl "postgresql://..."

param(
  [string]$SourceUrl = $env:SUPABASE_SOURCE_DATABASE_URL,
  [string]$OutFile = "supabase_data_dump.sql"
)

$ErrorActionPreference = "Stop"

if (-not $SourceUrl) {
  Write-Error "Set SUPABASE_SOURCE_DATABASE_URL or pass -SourceUrl (postgresql://...)"
}

$tables = @(
  "public.stores",
  "public.blog_posts",
  "public.coupons",
  "public.coupon_clicks"
)

$pgDumpArgs = @(
  $SourceUrl,
  "--data-only",
  "--no-owner",
  "--no-privileges",
  "-f", $OutFile
)
foreach ($t in $tables) {
  $pgDumpArgs += "-t"
  $pgDumpArgs += $t
}

Write-Host "Writing $OutFile ..."
& pg_dump @pgDumpArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done."
