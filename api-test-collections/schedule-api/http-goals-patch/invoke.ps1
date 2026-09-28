param([Parameter(Mandatory = $true)][string]$Token,[Parameter(Mandatory = $true)][string]$GoalId)
$body = Get-Content "$PSScriptRoot\sample-data.json" -Raw
& "$PSScriptRoot\..\request.ps1" -Method PATCH -Path "/goals/$GoalId" -Token $Token -Body $body