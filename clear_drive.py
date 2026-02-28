import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from drive_storage import get_drive_service, ROOT_FOLDER_ID

service = get_drive_service()
if not service:
    print("Drive service not available.")
    sys.exit(1)

print(f"Searching for Patient History folders in {ROOT_FOLDER_ID}...")

# List all folders starting with PAT_ inside the ROOT_FOLDER
query = f"'{ROOT_FOLDER_ID}' in parents and name contains 'PAT_' and trashed=false and mimeType='application/vnd.google-apps.folder'"
results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()

folders = results.get('files', [])
if not folders:
    print("No patient history folders found on Drive.")
else:
    for folder in folders:
        print(f"Trashing folder: {folder['name']} ({folder['id']})")
        service.files().update(fileId=folder['id'], body={'trashed': True}).execute()
        
print("All patient history folders trashed on Google Drive.")
