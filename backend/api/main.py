from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routers import god, miner, simulation

app = FastAPI(title="Block3RChain God-Mode Orchestrator")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to database
@app.on_event("startup")
def on_startup():
    init_db()

# Include Routers
app.include_router(simulation.router)
app.include_router(god.router)
app.include_router(miner.router)
