$ErrorActionPreference = "Stop"

$OutDir = "StitchAssets"
if (!(Test-Path -Path $OutDir)) {
    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
}
Write-Host "Downloading assets to $OutDir..."

# Login - Dark Theme
Write-Host "Downloading Login - Dark Theme..."
curl.exe -s -L -o "$OutDir\Login_Dark_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0uj3OOwqVcsQhkV-Za1VCvdVR1lRN6E7PVj1JcknwNYtCAn_srOQACXeEbbHjZCAUG4UJlwk-UOZEbRd60KC3dMVxR1nx7Yzn83dOWqFjn685rO9ypOhOvLn0xabN5lfKs73t5JkUH9CZWVKBWts1WxM5X40h83MDAYEogk7iEcJq1_X7Lg-Wh1c8egP8nryZfg-xuv22GXZfDPPFL7sPo0-TWz1ZE2Q8kJY3DcY_JZpPqiMZeAOvJ0ZwA"
curl.exe -s -L -o "$OutDir\Login_Dark_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzlkOWI3YmQzMWUzMzQ2YWY5ZmVlNzkwMDQxYmVjMzBjEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Login - Light Theme
Write-Host "Downloading Login - Light Theme..."
curl.exe -s -L -o "$OutDir\Login_Light_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0uhlMBH15RN3wBR8Jxz2bqDU08J_B0mmiWOItoZZZVrlQZgoT-xLYajEmQqqPeKMtQImCUjfY6Mh7sdoSQIsGc9OUgT1Y4i4frHjBET14JRqjF14AYCgZE5vIYPaXOuERxAnrFxGpLlrd9GKlGrneAE6rMlyT1SPe0IpqZIUBc18gtZqKc7hXNpH8Yjlpy6zaVVlOcGyvvFDbglTBbuZB1oXhDAI9AZIMGphEDMt8nmijDmwLOx09f-LuA"
curl.exe -s -L -o "$OutDir\Login_Light_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzg1NGRjMDU5Y2RiZjQzNGU4MGM0NDkyMGZhZGNlMjM4EgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Dashboard - Light Theme
Write-Host "Downloading Dashboard - Light Theme..."
curl.exe -s -L -o "$OutDir\Dashboard_Light_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0ugUfNkB5sdPUzlAtHvyliGJ43Gea0AASuRBEv1y8kFl72BFi0ai79m18QuCScHgMOEZg_Gd4A5-9kB-vSEpMNmxnit04sAW-Fm5Q07jw4KjlrG87Cib38PV_-Hh3b5uuPSBhzyWYsZIBpik9KUIuHsPZNlvs6LMBLVmzQ4NyrpxsQAo-23Z3jUb66DfnThYsTiWYmsPqLbaa6JTNBwGYxhtBvlfWLtwzQo311YOixbNnfQC6W1CQxoqXFA"
curl.exe -s -L -o "$OutDir\Dashboard_Light_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzhjNzRkNDEwYjdiNTQzYWNhOTQ5NjI4MjlmNTRmNjQ1EgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Scanning Center - Light Theme
Write-Host "Downloading Scanning Center - Light Theme..."
curl.exe -s -L -o "$OutDir\Scanning_Center_Light_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0ujsiXUU2c1Cb05UZVkO2OfgvFKE4j3j0VAqktXMCgRsdKczXFAlMxnDucs4pVE-VYMkwZiy59UtNAqpZxPjeXrpknk_h8P9cY-nA00iCknZ_bzaRaVhtBz0PO_UKrH5be64fX-ny4jNEIro1hRPa4hRcVHXINpZswB34GiaK16ywU1CzwD3BcUW8eRUTpbugBBtQiIlhP4ITteFFInYSQOW4UJlOhlmCOtF-xAzqtseZ8FEKP059q9K1aw"
curl.exe -s -L -o "$OutDir\Scanning_Center_Light_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzJlNWNlNDEyMGI0MDQ2ODJiMjUzMDM3MDNlNDI4M2JmEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Scanning Center - Dark Theme
Write-Host "Downloading Scanning Center - Dark Theme..."
curl.exe -s -L -o "$OutDir\Scanning_Center_Dark_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0uii9YoE9tvyXfES1bif4EmWQYAXZ3UVI1mCffws1jwj4hknLkmElJmVq0Lfb048jDPI4IQ_zNtmL3jdgJjUxuZLI8ZWb1Ia2OHgagIq0OwdC-_qKS44fTEoxnN_3IgWQMpFuiyDWhHq0j1kLCBopw_WFC1E0P99T_rTkpKvBbmt5yLxfZvt25V0kGIuJZnMY_I7z-aC6qDKCzkM7dKeSG7HxaddHYbchVx0VrX5XUQV4BUiailnEqcPKg"
curl.exe -s -L -o "$OutDir\Scanning_Center_Dark_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2RlZTM0NGJiMDQ2NTQxOTVhYzM4NTEzOWY5ZmJiNGJlEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Analysis Results - Light Theme
Write-Host "Downloading Analysis Results - Light Theme..."
curl.exe -s -L -o "$OutDir\Analysis_Results_Light_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0uinVA68pwoTcLwnni4DHS3RVnPxpj3gUkAyoWlgf892jGNOoGvhyAMor8GdNTAFnBxD8ZhtX1xyDWVU-jrcTJazcKkpQMUN95PLcVYymaCI_mqfgo6WTPPNoGr_TV4H_Z168jt7MaJQ2zA8t1vpR1vYR1wE_hP7GvVxyZTuxNNWf90Ki47qcBXe0adMDNWz_DJdYScpISXmPKcnxZe14TkU5zhfLX5K8uEcogbPAS5kgNQ0DC5ir7XZdw"
curl.exe -s -L -o "$OutDir\Analysis_Results_Light_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2RkMWY5ZTQxMWU5NTQxNzhiZDA3YTUzZDk2NzlkNzgzEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Dashboard - Dark Theme
Write-Host "Downloading Dashboard - Dark Theme..."
curl.exe -s -L -o "$OutDir\Dashboard_Dark_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0ugl9jz8STMVQ0CfDp3UlDKnMnynHwrvxckO6YxrBPb-o-tlVBVaTiSGvk71V1BZUn22yR714WLwU0Tm4nsb_J8E0o7Q0xiPnfz5MHZsq4eusEj2HmgpeqvEzxWn2Iux2zaQshSmzLNozEdNwAsefHieqzNRnQN8ZQhI1M9uE1E1Skb--LKsYGHANnt0iq6eEJmWgNkcOpgJJxZXflplkxS9pQHgiLHNvc-AYfYIuVq5-XkHB2z6Sv0egH4"
curl.exe -s -L -o "$OutDir\Dashboard_Dark_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzY1NTNmZGUwYmY2YzQyYTA4ODQ0YjYwYjEzMWMyZjhjEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Analysis Results - Dark Theme
Write-Host "Downloading Analysis Results - Dark Theme..."
curl.exe -s -L -o "$OutDir\Analysis_Results_Dark_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0uhte_D_MEjDPi0XTpcjOqtQc5zTAtUByKsyE6RpYUikDxHmwn9WB490J_ph3iUkkRueES91X2Ol-LrW7JrrBH_ZuSb5uCzhaI0_yrs5Ho89Qp9aHv8G9uycplA0iHbNyJFpLiBpn2eLEwXOlONg_y9oI6PaXAsjyCLi3WOsDV9CEGvQYcMfYpoahD3-AGLxz9zosub-5GuTXZAVbsGwlVuF4LZC5G-5r1gflAdLVwjO_uh_O7PnficIyg"
curl.exe -s -L -o "$OutDir\Analysis_Results_Dark_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2VhOTVjMTM4YTAzMTQzYTVhZDg4YmI4OGU5NjM0NjQxEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Staff Management - Light Theme
Write-Host "Downloading Staff Management - Light Theme..."
curl.exe -s -L -o "$OutDir\Staff_Management_Light_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0ujJ8f9HJKe3CISIf3flyfviq84WYhArlWddJQ9YMswaTQcxHlGYSITcmXtWP4F_l_9XXzcY-8HcGufkvzJeQOz9PqSL8an5oXBx3bvmzvdYuhedRJ-u5yHn-LTgU3XdBXiPQbZ_kEJP9UvkRyFiImC6fUMOPx__DRh4qVOMWBYrmmdBDnbqtN1GXHF80bwoSS0qjXzBwiewM_tt7YVBD5WaXgThIp8Xuu64FHmNc9V6grF7aEMATrPJUKk"
curl.exe -s -L -o "$OutDir\Staff_Management_Light_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2E0MTBmNmVkY2JjMDQ5MmM5NDVlZjdiNGViM2E0NDRiEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

# Staff Management - Dark Theme
Write-Host "Downloading Staff Management - Dark Theme..."
curl.exe -s -L -o "$OutDir\Staff_Management_Dark_Theme.png" "https://lh3.googleusercontent.com/aida/ADBb0uiwElWY-UkqX-jEI4AIpCCGtqc5BPIzQbLNoRF_uRRlAnOww6AYQ-DuE-v-BQhj5MhFzf0B6hNbvWXwmOaL8JC-l7cKv9R7rLTrVcYtbkmWjV1dT-shTrYfCFn3zV5uIuXNNf12RO-Iq6NbU9Hc3bAZe2C9DGAGSkjbOFE5amEx58T-KfBsu0oCX5spCHW1xnaMJvQlm-rJ98iwMvjeFO63Zk1OjpzpuRBS-XWOfa94mhWbEcKTCD7Skw"
curl.exe -s -L -o "$OutDir\Staff_Management_Dark_Theme.html" "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzE0ZmI5MzU2YmFhYjRjY2I4NDY4N2ZlNzI0MzI5MmYzEgsSBxCF4-Oc2hYYAZIBIwoKcHJvamVjdF9pZBIVQhMzNjc0NjY0NzgwMjg0OTU3OTc4&filename=&opi=89354086"

Write-Host "`nAll downloads complete. Assets saved to 'StitchAssets' folder."
