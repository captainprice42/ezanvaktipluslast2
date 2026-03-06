@echo off
set /p commit_mesaji="Commit mesajini gir (Bos birakirsan 'Guncelleme' yazilir): "

if "%commit_mesaji%"=="" set commit_mesaji=Guncelleme

echo --- Git islemi basliyor... ---
git add .
git commit -m "%commit_mesaji%"
git push origin main

echo --- Islem Tamam! GitHub'a firlatildi. ---
pause