import json
import base64
from fastapi import WebSocket, WebSocketDisconnect

async def _process_eval_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            req = json.loads(data)
            
            frame_type = req.get("frame_type", "top")
            image_data_url = req.get("image_data_url")
            image_url = req.get("image_url")
            
            image_b64 = None
            if image_data_url:
                try:
                    if "," in image_data_url:
                        image_b64 = image_data_url.split(",", 1)[1]
                    else:
                        image_b64 = image_data_url
                except Exception:
                    pass
            
            if not image_b64 and image_url and not image_url.startswith("local://"):
                try:
                    from app.data.image_utils import fetch_image_bytes
                    raw = await fetch_image_bytes(image_url)
                    if raw:
                        image_b64 = base64.b64encode(raw).decode("utf-8")
                except Exception as e:
                    pass
            
            if not image_b64:
                await websocket.send_json({
                    "approved": True,
                    "quality_score": 0.5,
                    "feedback": "Could not load image — accepted anyway",
                    "issues": [],
                    "detected": {},
                })
                continue
                
            from app.data.gemini import evaluate_frame
            result = await evaluate_frame(image_b64, frame_type)
            
            await websocket.send_json({
                "approved": result.get("approved", True),
                "quality_score": float(result.get("quality_score", 0.5)),
                "feedback": result.get("feedback", "Image captured"),
                "issues": result.get("issues", []),
                "detected": result.get("detected", {}),
            })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        pass

