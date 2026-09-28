param([string]$Token)
$payload = Get-Content "$PSScriptRoot\sample-data.json" -Raw | ConvertFrom-Json
$payload.email = "api-smoke-$([guid]::NewGuid().ToString('N'))@example.com"
$body = $payload | ConvertTo-Json -Compress
& "$PSScriptRoot\..\request.ps1" -Method POST -Path '/auth/register' -Token $Token -Body $body