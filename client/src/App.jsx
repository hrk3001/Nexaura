cd "C:\Users\HARITHAA\Nexaura"

$appPath = ".\client\src\App.jsx"

Copy-Item $appPath "$appPath.backup" -Force

$content = Get-Content $appPath -Raw

# Replace the old World Map placeholder
$oldMap = @'
if (view === 'map') {
    return (
      <ErrorBoundary>
        <WorldMap />
        <Dialogue />
      </ErrorBoundary>
    )
  }
'@

$newMap = @'
if (view === 'map') {
    return (
      <ErrorBoundary>
        <WorldMap />
        <Dialogue />
      </ErrorBoundary>
    )
  }
'@

if ($content.Contains($oldMap)) {
    $content = $content.Replace($oldMap, $newMap)
    Write-Output "World map updated."
} else {
    Write-Output "World map block did not match. Check App.jsx manually."
}

# Guard against null caseState in all world branches
$content = $content.Replace(
    '{caseState && !caseState.currentChallenge && (',
    '{caseState && !caseState.currentChallenge && ('
)

Set-Content -Path $appPath -Value $content -Encoding utf8

Write-Output "App.jsx update finished."
