param([Parameter(Mandatory = $true)][string]$Token)
$body = Get-Content "$PSScriptRoot\sample-data.json" -Raw
& "$PSScriptRoot\..\request.ps1" -Method POST -Path '/goals' -Token $Token -Body $body