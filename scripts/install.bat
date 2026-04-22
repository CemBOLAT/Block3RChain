@echo off
setlocal

echo Starting Block3RChain Installation...

set "BACKEND_DIR=backend"
set "FRONTEND_DIR=frontend"

echo Setting up Python Virtual Environment...
python -m venv "%BACKEND_DIR%\venv"
call "%BACKEND_DIR%\venv\Scripts\activate"

echo Installing Backend dependencies...
python -m pip install --upgrade pip
python -m pip install -r "%BACKEND_DIR%\requirements.txt"

echo Installing Frontend dependencies...
pushd "%FRONTEND_DIR%"
npm install
popd

echo.
echo Installation complete!
echo You can now start the simulation using: run.bat
pause
