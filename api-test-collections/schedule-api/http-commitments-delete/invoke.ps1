param([Parameter(Mandatory = $true)][string]$Token,[Parameter(Mandatory = $true)][string]$CommitmentId)
& "$PSScriptRoot\..\request.ps1" -Method DELETE -Path "/commitments/$CommitmentId" -Token $Token