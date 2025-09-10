from typing import Dict, Set
from fastapi import WebSocket
from collections import defaultdict

class Connection:
    def __init__(self, websocket: WebSocket, user_id: int):
        self.websocket = websocket
        self.user_id = user_id

class WSManager:
    def __init__(self):
        # chat_id -> set(Connection)
        self.connections: Dict[int, Set[Connection]] = defaultdict(set)

    def add(self, chat_id: int, conn: Connection):
        self.connections[chat_id].add(conn)

    def remove(self, chat_id: int, conn: Connection):
        if conn in self.connections[chat_id]:
            self.connections[chat_id].remove(conn)
        if not self.connections[chat_id]:
            del self.connections[chat_id]

    async def broadcast(self, chat_id: int, message: dict):
        conns = list(self.connections.get(chat_id, []))
        for c in conns:
            try:
                await c.websocket.send_json(message)
            except Exception:
                # si falla, lo quitamos
                await c.websocket.close()

ws_manager = WSManager()
