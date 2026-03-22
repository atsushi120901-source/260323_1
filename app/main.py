from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import pathlib

from app.converter import convert_images_to_pptx

app = FastAPI(title="Image to PowerPoint Converter")

STATIC_DIR = pathlib.Path(__file__).parent.parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def index():
    return FileResponse(str(STATIC_DIR / "index.html"))


@app.post("/convert")
async def convert(
    files: List[UploadFile] = File(...),
    slide_size: str = Form("16:9"),
    layout: str = Form("contain"),
    title_prefix: Optional[str] = Form(None),
    margin: float = Form(0.05),
):
    image_data_list = []
    for f in files:
        data = await f.read()
        image_data_list.append((data, f.filename or "image"))

    pptx_io = convert_images_to_pptx(
        image_data_list=image_data_list,
        slide_size=slide_size,
        layout=layout,
        title_prefix=title_prefix if title_prefix else None,
        margin=max(0.0, min(0.2, margin)),
    )

    return StreamingResponse(
        pptx_io,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": "attachment; filename=presentation.pptx"},
    )
