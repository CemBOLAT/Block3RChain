@echo off
echo Starting Block3RChain Simulation processes in Windows Terminal tabs...

wt -w main --title "FastAPI Backend" -d backend cmd /k "venv\Scripts\activate && uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
wt -w main new-tab --title "Miner Nodes" -d backend cmd /k "ping 127.0.0.1 -n 6 > nul && venv\Scripts\activate && python -m emulator.nodes"
wt -w main new-tab --title "Frontend Dashboard" -d frontend cmd /k "npm run dev"

echo All processes have started in Windows Terminal tabs!
