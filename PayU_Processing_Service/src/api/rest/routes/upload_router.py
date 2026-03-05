import json
from typing import List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, File, Form, UploadFile
from src.schemas.purchase_order_schema import PurchaseOrderRequest
from src.core.services.purchase_order_upload_service import uploadPurchaseOrder
from src.api.rest.dependencies import get_db
from src.core.security.jwt_handler import get_current_user
from src.core.services.invoice_upload_service import overrideInvoice, uploadInvoice
from src.schemas.invoice_schema import InvoiceRequest
from src.utils.file_upload import upload
from src.data.clients.redis import queue

upload_router = APIRouter(prefix="/upload")

@upload_router.post("/invoice")
async def upload_invoice(data = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    file_id = str(uuid.uuid4())
    file_url = await upload(file)
    queue.enqueue(
        "src.tasks.payu_tasks.execute_task",
        {
            "file_id": file_id,
            "task_type": "upload_invoice",
            "payload": json.loads(data),
            "file": file_url
        }
    )
    return {"status": "queued", "file_id": file_id}

@upload_router.put("/invoice/override/{invoice_number}")
async def override_invoice(data = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    file_id = str(uuid.uuid4())
    file_url = await upload(file, "invoice")
    queue.enqueue(
        "src.tasks.payu_tasks.execute_task",
        {
            "file_id": file_id,
            "task_type": "override_invoice",
            "payload": json.loads(data),
            "file": file_url
        }
    )
    return {"status": "queued", "file_id": file_id}

@upload_router.post("/purchase-order")
async def upload_purchase_orders(data = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    file_id = str(uuid.uuid4())
    file_url = await upload(file, "purchase order")
    queue.enqueue(
        "src.tasks.payu_tasks.execute_task",
        {
            "file_id": file_id,
            "task_type": "upload_po",
            "payload": json.loads(data),
            "file": file_url
        }
    )
    return {"status": "queued", "file_id": file_id}