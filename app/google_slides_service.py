import io
import os

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

SERVICE_ACCOUNT_FILE = os.environ.get("GOOGLE_SERVICE_ACCOUNT", "service_account.json")
SCOPES = ["https://www.googleapis.com/auth/drive"]


def upload_pptx_as_google_slides(pptx_bytes: bytes, name: str = "presentation") -> str:
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )
    drive = build("drive", "v3", credentials=creds)

    # mimeType に google-apps.presentation を指定すると Drive が自動変換
    file_meta = {
        "name": name,
        "mimeType": "application/vnd.google-apps.presentation",
    }
    media = MediaIoBaseUpload(
        io.BytesIO(pptx_bytes),
        mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )
    file = drive.files().create(body=file_meta, media_body=media, fields="id").execute()
    file_id = file["id"]

    # 誰でもリンクで閲覧できるよう権限付与
    drive.permissions().create(
        fileId=file_id, body={"type": "anyone", "role": "reader"}
    ).execute()

    return f"https://docs.google.com/presentation/d/{file_id}/edit"
