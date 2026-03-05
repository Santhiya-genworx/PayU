import uuid
from fastapi import APIRouter, File, UploadFile
from src.core.services.extraction_service import extract_text_from_document
from src.utils.file_upload import upload
from src.data.clients.redis import queue

extract_router = APIRouter(prefix="/extract")

@extract_router.post("/invoice")
async def extract_data_from_invoice(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_url = await upload(file, "invoice")
    queue.enqueue(
        "src.tasks.payu_tasks.execute_task",
        {
            "file_id": file_id,
            "task_type": "extract_invoice",
            "file": file_url
        }
    )
    return {"status": "queued", "file_id": file_id}

@extract_router.post("/purchase-order")
async def extract_data_from_po(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    file_url = await upload(file, "purchase order")
    queue.enqueue(
        "src.tasks.payu_tasks.execute_task",
        {
            "file_id": file_id,
            "task_type": "extract_po",
            "file": file_url
        }
    )
    return {"status": "queued", "file_id": file_id}