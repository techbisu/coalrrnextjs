$ErrorActionPreference = "Stop"
$srcDir = "d:\coalrrnextjs\src"

$files = Get-ChildItem -Path $srcDir -Recurse -Include *.ts, *.tsx -File

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    
    $modified = $false

    if ($content -match "createdAt") {
        $content = $content -replace "createdAt", "entryTs"
        $modified = $true
    }

    if ($content -match "updatedAt") {
        $content = $content -replace "updatedAt", "updtTs"
        $modified = $true
    }

    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated $($file.FullName)"
    }
}

Write-Host "Replacement complete."
