@echo off
echo ==========================================
echo      SINCRONIZANDO COM GITHUB... 🚀
echo ==========================================
echo.
echo 1. Adicionando arquivos...
git add .
echo.
echo 2. Salvando alteracoes...
git commit -m "Update via Sync Script %date% %time%"
echo.
echo 3. Enviando para o GitHub...
git push
echo.
echo ==========================================
echo           SUCESSO! ✅
echo ==========================================
pause
