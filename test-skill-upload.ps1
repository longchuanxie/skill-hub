# 技能上传测试脚本
$baseUrl = "http://localhost:3001"

# 首先登录获取token
Write-Host "1. 登录获取token..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/login" -Method Post -Body $loginData -ContentType "application/json" -UseBasicParsing
    $loginResponse = $response.Content | ConvertFrom-Json
    $token = $loginResponse.token
    $user = $loginResponse.user
    Write-Host "✅ 登录成功，用户ID: $($user.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 创建测试文件
Write-Host "`n2. 创建测试文件..." -ForegroundColor Yellow
$testFileContent = "console.log('Hello from SkillHub!');"
$testFilePath = "test-skill.js"
Set-Content -Path $testFilePath -Value $testFileContent
Write-Host "✅ 测试文件已创建" -ForegroundColor Green

# 上传文件
Write-Host "`n3. 上传技能文件..." -ForegroundColor Yellow
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($testFilePath)
    $fileContent = [System.Convert]::ToBase64String($fileBytes)
    
    $bodyLines = @()
    $bodyLines += "--$boundary"
    $bodyLines += "Content-Disposition: form-data; name=`"file`"; filename=`"test-skill.js`""
    $bodyLines += "Content-Type: application/javascript"
    $bodyLines += ""
    $bodyLines += $fileContent
    $bodyLines += "--$boundary--"
    
    $body = $bodyLines -join "`r`n"
    
    $authHeader = "Bearer $token"
    $headers = @{
        "Authorization" = $authHeader
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/upload" -Method Post -Body $body -ContentType "multipart/form-data; boundary=$boundary" -Headers $headers -UseBasicParsing
    $uploadResponse = $response.Content | ConvertFrom-Json
    Write-Host "✅ 文件上传成功: $($uploadResponse.file.url)" -ForegroundColor Green
    $fileUrl = $uploadResponse.file.url
} catch {
    Write-Host "❌ 文件上传失败: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 创建技能
Write-Host "`n4. 创建技能..." -ForegroundColor Yellow
try {
    $skillData = @{
        name = "测试技能"
        description = "这是一个测试技能，用于验证技能上传功能"
        author = $user.id
        version = "1.0.0"
        url = $fileUrl
        tags = @("测试", "示例", "JavaScript")
        permissions = @{
            type = "public"
        }
    } | ConvertTo-Json
    
    $authHeader = "Bearer $token"
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = $authHeader
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/skills" -Method Post -Body $skillData -Headers $headers -UseBasicParsing
    $skillResponse = $response.Content | ConvertFrom-Json
    Write-Host "✅ 技能创建成功: $($skillResponse.skill.name)" -ForegroundColor Green
    $skillId = $skillResponse.skill._id
} catch {
    Write-Host "❌ 技能创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 获取技能列表验证
Write-Host "`n5. 验证技能列表..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/skills" -Method Get -UseBasicParsing
    $skillsResponse = $response.Content | ConvertFrom-Json
    $createdSkill = $skillsResponse.skills | Where-Object { $_._id -eq $skillId }
    
    if ($createdSkill) {
        Write-Host "✅ 技能在列表中找到: $($createdSkill.name)" -ForegroundColor Green
    } else {
        Write-Host "❌ 技能在列表中未找到" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 获取技能列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 清理测试文件
Write-Host "`n6. 清理测试文件..." -ForegroundColor Yellow
Remove-Item $testFilePath -Force
Write-Host "✅ 测试文件已删除" -ForegroundColor Green

Write-Host "`n技能上传测试完成!" -ForegroundColor Green