@echo off
echo Starting Block3RChain Simulation processes in Windows Terminal tabs...

wt --title "FastAPI Backend" -d ..\backend cmd /k "pip install -r requirements.txt && uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload" ; new-tab --title "Miner Nodes" -d ..\backend cmd /k "ping 127.0.0.1 -n 6 > nul && python -m emulator.nodes" ; new-tab --title "Frontend Dashboard" -d ..\frontend cmd /k "npm install && npm run dev"

echo All processes have started in Windows Terminal tabs!
