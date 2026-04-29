param(
  [string]$Tag = $(Read-Host 'Release tag to create (e.g. v1.0.0)')
)

if (-not $Tag) { Write-Error 'Tag is required.'; exit 1 }

if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Output "Using gh CLI to create release $Tag and upload sanskrit-master-release.zip"
  if (-not (Test-Path .\sanskrit-master-release.zip)) {
    Write-Output 'Release ZIP not found; running package_release.ps1 to create it.'
    & .\package_release.ps1
  }
  gh release create $Tag .\sanskrit-master-release.zip --title "Release $Tag" --notes "Automated release created by upload_release.ps1"
  if ($LASTEXITCODE -ne 0) { Write-Error 'gh release command failed'; exit $LASTEXITCODE }
  Write-Output 'Release created and asset uploaded.'
} else {
  Write-Output 'gh CLI not found. To upload manually, install GitHub CLI (https://cli.github.com/) and rerun this script.'
  Write-Output 'Or create a release through GitHub web UI and upload sanskrit-master-release.zip from the repo root.'
}
