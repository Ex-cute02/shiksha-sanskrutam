param(
    [string]$OutDir = "release",
    [string]$ZipName = "sanskrit-master-release.zip"
)

$root = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $root

if (Test-Path $OutDir) { Remove-Item -Recurse -Force $OutDir }
New-Item -ItemType Directory -Path $OutDir | Out-Null

# Copy project excluding heavy/dev dirs
# Exclude heavy/dev dirs and the output directory itself to avoid recursion
$exclusions = @('.venv','.git','node_modules','.cache','__pycache__')
$exclusions += $OutDir
Get-ChildItem -Path . -Force | Where-Object { $exclusions -notcontains $_.Name } | ForEach-Object {
    $dest = Join-Path $OutDir $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -Recurse -Force -Path $_.FullName -Destination $dest
    } else {
        Copy-Item -Force -Path $_.FullName -Destination $dest
    }
}

# Detect large model caches but do not delete them automatically
$hf_cache = Join-Path $env:USERPROFILE ".cache\huggingface"
if (Test-Path $hf_cache) { Write-Output "HF cache found at: $hf_cache (not deleting to avoid long-running operations)" }

# Create zip (place ZIP at repo root to avoid including the ZIP inside itself)
$zipPath = Join-Path $root $ZipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $OutDir '*') -DestinationPath $zipPath

Write-Output "Created release at: $zipPath"; exit 0
