param([string]$Token)
$body = Get-Content "$PSScriptRoot\sample-data.json" -Raw
& "$PSScriptRoot\..\request.ps1" -Method POST -Path '/auth/login' -Token $Token -Body $body