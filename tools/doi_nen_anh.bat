@echo off
cd /d "%~dp0\.."
python "%~dp0doi_nen_anh.py"
if errorlevel 1 pause
