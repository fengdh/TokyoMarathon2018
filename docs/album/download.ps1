$folder = ".\"
$userAgent = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36"
$web = New-Object System.Net.WebClient
$web.Headers.Add("user-agent", $userAgent)
$web.Headers['cookie'] = "ALLSPORTS_SESS=;"
$web

Get-Content "D:\github\TokyoMarathon2018\docs\album\list.txt" |
    Foreach-Object {
				$item = $_.Split(" ",[System.StringSplitOptions]::RemoveEmptyEntries)
				""
				"" + $item[0]
        try {
            $target = join-path $folder $item[1]
						"  Save to file: " + $target
            $web.DownloadFile($item[0], $target)
        } catch {
            $_.Exception.Message
        }
}
