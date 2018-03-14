#  Copyright (C) 2011 by David Wright (davidwright@digitalwindfire.com)
#  All Rights Reserved.

#  Redistribution and use in source and binary forms, with or without
#  modification or permission, are permitted.

#  Additional information available at http://www.digitalwindfire.com.

$folder = ".\"
# "D:\github\TokyoMarathon2018\docs\album"
$userAgent = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Mobile Safari/537.36"
$web = New-Object System.Net.WebClient
$web.Headers.Add("user-agent", $userAgent)
$web.Headers['cookie'] = "ALLSPORTS_SESS=3ada7d3768ff6205a31bd975db437774527c73fc3a4586f48b62dd85b2fe5c7f; AWSALB=BUaD2qIW5/DvLe3uCzJM7kSbthr+lC9Bwtm9Ni/j7CMq0i477bDl9Q7JcE5vzjYFH2YvaaKZtTxIR9hDGKtOgmf4dbM/Bg2cyetWmchcVyOSK8/ymfakl2F70S4V"

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
