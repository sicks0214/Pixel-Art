@echo off
chcp 65001 >nul
color 0A
title 像素画转换器 - 本地启动

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           🎨 像素画转换器 - 本地Docker启动                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 进入脚本所在目录
cd /d "%~dp0"

:: 检查Docker是否运行
echo [1/5] 检查Docker状态...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ Docker未运行！
    echo.
    echo 请先启动Docker Desktop，然后重试。
    echo.
    pause
    exit /b 1
)
echo ✅ Docker运行正常
echo.

:: 检查前端是否已构建
echo [2/5] 检查前端构建状态...
if exist "backend\frontend\dist\index.html" (
    echo ✅ 前端已构建
    set BUILD_NEEDED=0
) else (
    echo ⚠️  前端未构建，将自动构建
    set BUILD_NEEDED=1
)
echo.

:: 如果需要，构建前端
if %BUILD_NEEDED%==1 (
    echo [3/5] 构建前端（首次约2-3分钟）...
    cd frontend
    
    :: 检查node_modules
    if not exist "node_modules" (
        echo    安装依赖...
        call npm install
        if %errorlevel% neq 0 (
            color 0C
            echo.
            echo ❌ 依赖安装失败！
            pause
            exit /b 1
        )
    )
    
    echo    编译构建...
    call npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo ❌ 前端构建失败！
        pause
        exit /b 1
    )
    
    cd ..
    echo ✅ 前端构建完成
) else (
    echo [3/5] 跳过前端构建（已存在）
)
echo.

:: 复制前端到后端
echo [4/5] 复制前端文件...
if not exist "backend\frontend" mkdir "backend\frontend"
xcopy /E /I /Y /Q "frontend\dist" "backend\frontend\dist" >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ 文件复制失败！
    pause
    exit /b 1
)
echo ✅ 文件复制完成
echo.

:: 启动Docker容器
echo [5/5] 启动Docker容器...
docker-compose -f docker-compose.local.yml up -d --build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ Docker构建失败！
    echo.
    pause
    exit /b 1
)
echo ✅ 容器启动完成
echo.

:: 等待服务就绪
echo 等待服务启动（10秒）...
timeout /t 10 /nobreak >nul
echo.

:: 检查容器状态
docker ps | findstr pixel-art-local >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ 容器未运行！
    echo.
    echo 查看错误日志：
    docker logs pixel-art-local --tail 20
    echo.
    pause
    exit /b 1
)

:: 成功
color 0A
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ 启动成功！                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🌐 访问地址: http://localhost:3001
echo 🏥 健康检查: http://localhost:3001/api/health
echo.
echo 📝 提示:
echo    - 双击"查看日志.bat"可查看运行日志
echo    - 双击"停止本地Docker.bat"可停止服务
echo    - 按任意键打开浏览器...
echo.

pause >nul

:: 打开浏览器
start http://localhost:3001

exit /b 0

