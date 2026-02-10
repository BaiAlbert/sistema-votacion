@echo off

echo Iniciando backend...
start cmd /k "cd backend && php -S localhost:8000"

echo Iniciando frontend...
start cmd /k "cd frontend && npm run dev"

echo Proyecto arrancado correctamente.
pause