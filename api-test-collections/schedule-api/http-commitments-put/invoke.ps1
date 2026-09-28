param([Parameter(Mandatory = $true)][string]$Token,[Parameter(Mandatory = $true)][string]$CommitmentId)
$body = Get-Content "$PSScriptRoot\sample-data.json" -Raw
& "$PSScriptRoot\..\request.ps1" -Method PUT -Path "/commitments/$CommitmentId" -Token $Token -Body $body