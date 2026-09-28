param([Parameter(Mandatory = $true)][string]$Token)
& "$PSScriptRoot\..\request.ps1" -Method GET -Path '/schedule/current' -Token $Token