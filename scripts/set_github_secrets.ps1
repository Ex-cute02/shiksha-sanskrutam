<#
Sets repository GitHub Secrets using the GitHub CLI (`gh`).

Usage: run this from the repo root (where .git is) after installing and authenticating `gh`:

  powershell -ExecutionPolicy Bypass -File .\scripts\set_github_secrets.ps1

The script will prompt for values. For JSON credentials (GCP service account or Google creds), you may
provide a path to a file when prompted.

Secrets created:
- HF_TOKEN (required)
- GCP_SA_KEY (JSON; required for Cloud Run deploy)
- GCP_PROJECT (required)
- GCP_REGION (required)
- GOOGLE_CREDS (optional - JSON for Google Translate fallback)

This sets repository-level secrets visible to Actions. It requires `gh auth login` to be done already.
#>

function Ensure-GhCli {
    $gh = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $gh) {
        Write-Error "GitHub CLI ('gh') is not installed or not in PATH. Install from https://cli.github.com/"
        exit 2
    }
}

function Check-GhAuth {
    $status = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "You are not authenticated to GitHub via 'gh'. Run: gh auth login" -ForegroundColor Yellow
        $ok = Read-Host "Continue anyway? (y/N)"
        if ($ok -ne 'y') { exit 3 }
    }
}

function Read-Secret-Or-File($prompt, [switch]$allowFile) {
    if ($allowFile) {
        $path = Read-Host "$prompt (enter path to file or press Enter to type/paste value)"
        if ($path -and (Test-Path $path)) {
            return Get-Content -Raw -Encoding UTF8 -Path $path
        }
    }
    $secure = Read-Host -AsSecureString "$prompt (value will be hidden)"
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
    return $plain
}

Ensure-GhCli
Check-GhAuth

Write-Host "Setting repository secrets for the current repo..." -ForegroundColor Cyan

$repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
if (-not $repo) { $repo = Read-Host "Could not detect repo; enter owner/repo (e.g. user/repo)" }

# Required: HF_TOKEN (Hugging Face token)
$hf = Read-Secret-Or-File -prompt "HF_TOKEN (Hugging Face token)"
if ($hf) { gh secret set HF_TOKEN --body $hf --visibility all; Write-Host "HF_TOKEN set" }

# GCP service account key (JSON) - provide path or paste JSON
$gcp_sa = Read-Secret-Or-File -prompt "GCP_SA_KEY (path to JSON file or paste contents)" -allowFile
if ($gcp_sa) { gh secret set GCP_SA_KEY --body $gcp_sa --visibility all; Write-Host "GCP_SA_KEY set" }

# GCP project
$gcp_proj = Read-Host "GCP_PROJECT (project id)"
if ($gcp_proj) { gh secret set GCP_PROJECT --body $gcp_proj --visibility all; Write-Host "GCP_PROJECT set" }

# GCP region
$gcp_reg = Read-Host "GCP_REGION (e.g. us-central1)"
if ($gcp_reg) { gh secret set GCP_REGION --body $gcp_reg --visibility all; Write-Host "GCP_REGION set" }

# Optional: GOOGLE_CREDS (JSON for Google Translate service account) - provide path or paste
$google_creds = Read-Secret-Or-File -prompt "GOOGLE_CREDS (optional path to JSON or paste contents)" -allowFile
if ($google_creds) { gh secret set GOOGLE_CREDS --body $google_creds --visibility all; Write-Host "GOOGLE_CREDS set" }

Write-Host "All requested secrets processed. Verify in repository Settings -> Secrets -> Actions." -ForegroundColor Green
