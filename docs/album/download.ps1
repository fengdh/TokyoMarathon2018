$folder = ".\"
$userAgent = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36"
$web = New-Object System.Net.WebClient
$web.Headers.Add("user-agent", $userAgent)
$web.Headers['cookie'] = "ALLSPORTS_SESS=3ada7d3768ff6205a31bd975db437774527c73fc3a4586f48b62dd85b2fe5c7f;"
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
