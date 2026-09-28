param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [string]$Token,
    [string]$Body
)

$headers = @{}
if ($Token) { $headers.Authorization = "Bearer $Token" }
$params = @{ Uri = "http://localhost:7071/api$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true }
if ($Body) { $params.ContentType = 'application/json'; $params.Body = $Body }
try {
    $response = Invoke-WebRequest @params
    Write-Output ("{0} {1}" -f $response.StatusCode, $response.Content)
} catch {
    if ($_.Exception.Response) {
        $response = $_.Exception.Response
        Write-Output ("{0} {1}" -f [int]$response.StatusCode, $_.Exception.Message)
        exit 1
    }
    throw
}