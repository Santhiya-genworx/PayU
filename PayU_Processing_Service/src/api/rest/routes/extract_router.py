from fastapi import APIRouter, File, UploadFile
from src.core.services.extraction_service import extract_text_from_document

extract_router = APIRouter(prefix="/extract")

@extract_router.post("/invoice")
async def extract_data_from_invoice(file: UploadFile = File(...)):
    return await extract_text_from_document(file, "invoice")

@extract_router.post("/purchase-order")
async def extract_data_from_po(file: UploadFile = File(...)):
    return await extract_text_from_document(file, "purchase order")