import base64
import os
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
    
async def extract_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text("text")

        text = text.strip()
        if not text:
            raise ValueError("Empty PDF content")

        return text
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")

async def extract_image(file_path: str) -> str:
    try:
        file_bytes = None
        with open(file_path, "rb") as f:
            file_bytes = f.read()
        return base64.b64encode(file_bytes).decode("utf-8")

    except Exception as e:
        raise Exception(f"Image Processing failed: {str(e)}")

async def extract_text_from_document(file_path: str, document_type: str):
    try:
        file_type = detect_file_type(file_path)
        raw_text = ""
        
        if file_type == "pdf":
            raw_text = await extract_pdf(file_path)
        elif file_type == "image":
            raw_text = await extract_image(file_path)
        else:
            raise Exception(f"Unsupported file type: {file_type}")

        return await invoke_graph(raw_text, file_type, document_type)

    except Exception as e:
        raise Exception(f"Document extraction failed: {str(e)}")