@echo off
cd /d "%~dp0"
git init
git add -A
git commit -m "Initial commit: ZENTO Seller CRM"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://javohirmirz0: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@github.com/javohirmirz0/zento-seller-crm.git
git push -u origin main
echo.
echo ============================================
echo Tugadi. Yuqorida xato bo'lsa, shu oynani skrinshot qilib yuboring.
echo ============================================
pause
