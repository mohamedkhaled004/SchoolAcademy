# Admin API Test Script for Windows PowerShell
Write-Host "🚀 Starting Admin API Test..." -ForegroundColor Green
Write-Host ""

# Step 1: Test server connectivity
Write-Host "📋 Step 1: Testing server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/stats/students" -Method GET -TimeoutSec 10
    Write-Host "✅ Server is running. Found $($response.count) students" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not accessible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Get admin token
Write-Host "🔑 Step 2: Getting admin token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@example.com"
        password = "Admin12345!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    
    if ($loginResponse.token) {
        $token = $loginResponse.token
        Write-Host "✅ Admin token obtained successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ No token in response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Test admin students endpoint
Write-Host "🌐 Step 3: Testing /api/admin/students endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $studentsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/admin/students" -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "✅ API call successful" -ForegroundColor Green
    Write-Host "📊 Found $($studentsResponse.Count) students" -ForegroundColor Green
    
    if ($studentsResponse.Count -gt 0) {
        Write-Host ""
        Write-Host "👥 Student Data:" -ForegroundColor Cyan
        
        for ($i = 0; $i -lt $studentsResponse.Count; $i++) {
            $student = $studentsResponse[$i]
            Write-Host ""
            Write-Host "👤 Student $($i + 1):" -ForegroundColor White
            Write-Host "  ID: $($student.id)" -ForegroundColor Gray
            Write-Host "  Name: $($student.name)" -ForegroundColor Gray
            Write-Host "  Email: $($student.email)" -ForegroundColor Gray
            Write-Host "  Phone: $($student.phoneNumber)" -ForegroundColor Gray
            Write-Host "  Guardian Phone: $($student.guardianPhone)" -ForegroundColor Gray
            Write-Host "  Location: $($student.currentLocation)" -ForegroundColor Gray
            Write-Host "  Country: $($student.country)" -ForegroundColor Gray
            Write-Host "  Created: $($student.created_at)" -ForegroundColor Gray
        }
        
        # Check field presence
        Write-Host ""
        Write-Host "🔍 Field Presence Check:" -ForegroundColor Cyan
        for ($i = 0; $i -lt $studentsResponse.Count; $i++) {
            $student = $studentsResponse[$i]
            Write-Host ""
            Write-Host "📋 Student $($i + 1) field check:" -ForegroundColor White
            
            $fields = @("phoneNumber", "guardianPhone", "currentLocation", "country")
            foreach ($field in $fields) {
                $value = $student.$field
                if ($value) {
                    Write-Host "  ✅ $field`: $value" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ $field`: NULL/Empty" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "📭 No students found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ API test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "✅ Test completed successfully!" -ForegroundColor Green
Write-Host "🏁 Script finished" -ForegroundColor Gray 