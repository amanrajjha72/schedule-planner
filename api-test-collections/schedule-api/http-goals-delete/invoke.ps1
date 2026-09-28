param([Parameter(Mandatory = $true)][string]$Token,[Parameter(Mandatory = $true)][string]$GoalId)
& "$PSScriptRoot\..\request.ps1" -Method DELETE -Path "/goals/$GoalId" -Token $Token