# SkillHub API 测试脚本
Write-Host "开始测试 SkillHub API..." -ForegroundColor Green

$baseUrl = "http://localhost:3001"

# 测试健康检查
Write-Host "`n1. 测试健康检查..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method Get -UseBasicParsing
    Write-Host "✅ 健康检查通过: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试用户注册
Write-Host "`n2. 测试用户注册..." -ForegroundColor Yellow
try {
    $userData = @{
        username = "testuser"
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/register" -Method Post -Body $userData -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ 用户注册成功: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ 用户注册失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试用户登录
Write-Host "`n3. 测试用户登录..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/users/login" -Method Post -Body $loginData -ContentType "application/json" -UseBasicParsing
    $loginResponse = $response.Content | ConvertFrom-Json
    $token = $loginResponse.token
    Write-Host "✅ 用户登录成功，获取到token" -ForegroundColor Green
} catch {
    Write-Host "❌ 用户登录失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试获取所有技能
Write-Host "`n4. 测试获取所有技能..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/skills" -Method Get -UseBasicParsing
    Write-Host "✅ 获取技能列表成功: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ 获取技能列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试获取所有提示词
Write-Host "`n5. 测试获取所有提示词..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/prompts" -Method Get -UseBasicParsing
    Write-Host "✅ 获取提示词列表成功: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ 获取提示词列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n测试完成!" -ForegroundColor Green
