param([Parameter(Mandatory = $true)][string]$Token)
& "$PSScriptRoot\..\request.ps1" -Method GET -Path '/goals' -Token $Token