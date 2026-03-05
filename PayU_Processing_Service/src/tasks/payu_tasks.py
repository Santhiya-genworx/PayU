import asyncio
import json
from src.core.services.invoice_upload_service import uploadInvoice, overrideInvoice
from src.core.services.purchase_order_upload_service import uploadPurchaseOrder
from src.core.services.extraction_service import extract_text_from_document
from src.schemas.invoice_schema import InvoiceRequest
from src.schemas.purchase_order_schema import PurchaseOrderRequest
from src.api.rest.dependencies import AsyncSessionLocal

def execute_task(data: dict):
    task_type = data.get("task_type")
    asyncio.run(_async_execute(task_type, data))

async def _async_execute(task_type: str, data: dict):

    async with AsyncSessionLocal() as db:

        if task_type == "upload_invoice":
            parsed = InvoiceRequest(**data["payload"])
            await uploadInvoice(parsed, data["file"], db)

        elif task_type == "override_invoice":
            parsed = InvoiceRequest(**data["payload"])
            await overrideInvoice(parsed, data["file"], db)

        elif task_type == "upload_po":
            parsed = PurchaseOrderRequest(**data["payload"])
            await uploadPurchaseOrder(parsed, data["file"], db)

        elif task_type == "extract_invoice":
            await extract_text_from_document(data["file"], "invoice")

        elif task_type == "extract_po":
            await extract_text_from_document(data["file"], "purchase order")

        else:
            raise ValueError("Invalid task type")