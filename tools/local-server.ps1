# Small Windows-only loopback HTTP server. No packages, installation or admin needed.
# Stop it with Ctrl+C. Accessible only from the local computer.
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$address = [System.Net.IPAddress]::Parse('127.0.0.1')
$listener = [System.Net.Sockets.TcpListener]::new($address, 8000)
$mime = @{
 '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8';
 '.js'='text/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8';
 '.svg'='image/svg+xml'; '.png'='image/png'; '.webp'='image/webp';
 '.ico'='image/x-icon'; '.txt'='text/plain; charset=utf-8'; '.xml'='application/xml'
}
try {
  $listener.Start()
  Write-Host 'Piano Play Lab is running at http://localhost:8000/' -ForegroundColor Green
  Write-Host 'Keep this window open while testing. Press Ctrl+C to stop.'
  Start-Process 'http://localhost:8000/'
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 4000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream,[Text.Encoding]::ASCII,$false,1024,$true)
      $line = $reader.ReadLine()
      if (!$line) { continue }
      while ($true) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) { break }
      }
      $parts = $line.Split(' ')
      $code=200; $reason='OK'; $contentType='text/plain; charset=utf-8'
      $body=[byte[]]@()
      if ($parts.Count -lt 2 -or $parts[0] -notin @('GET','HEAD')) {
        $code=405; $reason='Method Not Allowed'
      } else {
        $urlPath = $parts[1].Split('?')[0]
        try { $decoded = [Uri]::UnescapeDataString($urlPath) } catch { $decoded = '' }
        if ($decoded -eq '/') { $decoded='/index.html' }
        $relative = $decoded.TrimStart('/').Replace('/','\')
        $file = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
        if (!$file.StartsWith($root+[System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $file -PathType Leaf)) {
          $code=404; $reason='Not Found'
        } else {
          $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
          if ($mime.ContainsKey($ext)) { $contentType=$mime[$ext] }
          $body=[System.IO.File]::ReadAllBytes($file)
        }
      }
      if ($code -ne 200) { $body=[Text.Encoding]::UTF8.GetBytes("$code $reason") }
      $headers = "HTTP/1.1 $code $reason`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
      $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
      $stream.Write($headerBytes,0,$headerBytes.Length)
      if ($parts[0] -ne 'HEAD' -and $body.Length -gt 0) { $stream.Write($body,0,$body.Length) }
      $stream.Flush()
    } catch {
      Write-Warning "Request failed: $($_.Exception.Message)"
    } finally {
      $client.Close()
    }
  }
} catch {
  Write-Host "Server error: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
} finally {
  $listener.Stop()
}
