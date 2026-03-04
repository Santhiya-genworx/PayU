import json
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, File, Form, UploadFile
from src.schemas.purchase_order_schema import PurchaseOrderRequest
from src.core.services.purchase_order_upload_service import uploadPurchaseOrder
from src.api.rest.dependencies import get_db
from src.core.security.jwt_handler import get_current_user
from src.core.services.invoice_upload_service import overrideInvoice, uploadInvoice
from src.schemas.invoice_schema import InvoiceRequest

upload_router = APIRouter(prefix="/upload")

@upload_router.post("/invoice")
async def upload_invoice(data = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    parsed_data = InvoiceRequest(**json.loads(data))
    return await uploadInvoice(parsed_data, file, db)

@upload_router.put("/invoice/override/{invoice_number}")
async def override_invoice(data = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    parsed_data = InvoiceRequest(**json.loads(data))
    return await overrideInvoice(parsed_data, file, db)

@upload_router.post("/purchase-order")
async def upload_purchase_orders(data = Form(...), file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    parsed_data = PurchaseOrderRequest(**json.loads(data))
    return await uploadPurchaseOrder(parsed_data, file, db)