param([Parameter(Mandatory = $true)][string]$Token)
$body = Get-Content "$PSScriptRoot\sample-data.json" -Raw
& "$PSScriptRoot\..\request.ps1" -Method PUT -Path '/schedule/current' -Token $Token -Body $body