import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request

router = APIRouter()
logger = logging.getLogger(__name__)

connected_clients = set()


@router.websocket("/alerts")
async def websocket_alerts(websocket: WebSocket, request: Request):
    await websocket.accept()
    connected_clients.add(websocket)
    processor = request.app.state.alert_processor

    async def send_update(event_type: str, data: dict):
        try:
            await websocket.send_json({"type": event_type, "data": data})
        except Exception:
            pass

    processor.register_websocket_callback(send_update)
    logger.info(f"WebSocket client connected. Total: {len(connected_clients)}")

    try:
        # Send welcome message
        await websocket.send_json({"type": "connected", "data": {"message": "Connected to Alert Stream"}})
        while True:
            # Keep connection alive with ping
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping", "data": {}})
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        processor.unregister_websocket_callback(send_update)
        connected_clients.discard(websocket)
