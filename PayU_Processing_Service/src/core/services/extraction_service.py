import base64
import os
from fastapi import UploadFile
import fitz
from src.control.graph import invoke_graph

def detect_file_type(file_path: str) -> str:
    extension = os.path.splitext(file_path)[1].lower()
    if extension == ".pdf":
        return "pdf"
    elif extension in [".png", ".jpg", ".jpeg", ".webp"]:
        return "image"
    else:
        return "unsupported"
    
async def extract_pdf(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text")

        text = text.strip()
        if not text:
            raise ValueError("Empty PDF content")

        return text
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")

async def extract_image(file_bytes: bytes) -> str:
    try:
        return base64.b64encode(file_bytes).decode("utf-8")

    except Exception as e:
        raise Exception(f"Image Processing failed: {str(e)}")

async def extract_text_from_document(file: UploadFile, document_type: str):
    try:
        file_data = await file.read()
        file_type = detect_file_type(file.filename)
        raw_text = ""
        
        if file_type == "pdf":
            raw_text = await extract_pdf(file_data)
        elif file_type == "image":
            raw_text = await extract_image(file_data)
        else:
            raise Exception(f"Unsupported file type: {file_type}")

        return await invoke_graph(raw_text, file_type, document_type)

    except Exception as e:
        raise Exception(f"Document extraction failed: {str(e)}")