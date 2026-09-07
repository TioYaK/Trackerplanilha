
$LoopBat = "C:\Users\YaKe\AppData\Roaming\AuroriaWorker\scraper-worker\loop.bat"
$vbsContent = 'Set WshShell = CreateObject("WScript.Shell")' + "
" + 'WshShell.Run "cmd.exe /c ""' + $LoopBat + '""", 0, False'
Write-Host $vbsContent
