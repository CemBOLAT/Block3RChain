from fastapi import WebSocket
from typing import List

from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        # simulation_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, simulation_id: str):
        await websocket.accept()
        if simulation_id not in self.active_connections:
            self.active_connections[simulation_id] = []
        self.active_connections[simulation_id].append(websocket)

    def disconnect(self, websocket: WebSocket, simulation_id: str):
        if simulation_id in self.active_connections:
            if websocket in self.active_connections[simulation_id]:
                self.active_connections[simulation_id].remove(websocket)

    async def broadcast_state(self, state_data: dict, simulation_id: str):
        """Broadcasts state data ONLY to connections in the specific simulation."""
        if simulation_id in self.active_connections:
            for connection in self.active_connections[simulation_id]:
                try:
                    await connection.send_json(state_data)
                except Exception:
                    pass
