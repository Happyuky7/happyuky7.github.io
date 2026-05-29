
# Dependabot PR bulk approval / merge (PowerShell)

These snippets let you approve all open Dependabot pull requests in one go.

## Prereqs

- You have GitHub CLI installed: `gh --version`
- You are authenticated: `gh auth status` (or `gh auth login`)
- Run from the repo folder (or pass `--repo OWNER/REPO` to `gh`)

## 1) Approve all open Dependabot PRs

```powershell
$prs = gh pr list --author "app/dependabot" --state open --json number --jq '.[].number'

foreach ($n in $prs) {
	Write-Host "Approving PR #$n"
	gh pr review $n --approve --body "Auto-approved (Dependabot)"
}
```

## 2) Approve + enable auto-merge (recommended)

This will merge each PR automatically once required checks pass and branch protection allows it.

```powershell
$prs = gh pr list --author "app/dependabot" --state open --json number --jq '.[].number'

foreach ($n in $prs) {
	Write-Host "Approving + enabling auto-merge for PR #$n"
	gh pr review $n --approve --body "Auto-approved (Dependabot)"
	gh pr merge  $n --squash --auto --delete-branch
}
```

## 3) Approve + merge immediately

Only works if checks already passed and your branch protection rules allow merging right now.

```powershell
$prs = gh pr list --author "app/dependabot" --state open --json number --jq '.[].number'

foreach ($n in $prs) {
	Write-Host "Approving + merging PR #$n"
	gh pr review $n --approve --body "Auto-approved (Dependabot)"
	gh pr merge  $n --squash --delete-branch
}
```

## If `--jq` is not available

Use PowerShell JSON parsing instead:

```powershell
$prs = gh pr list --author "app/dependabot" --state open --json number |
	ConvertFrom-Json |
	ForEach-Object { $_.number }

foreach ($n in $prs) {
	gh pr review $n --approve --body "Auto-approved (Dependabot)"
}
```

