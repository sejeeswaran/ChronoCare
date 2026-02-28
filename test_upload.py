import sys
import os
import tempfile
import logging

sys.path.append(r'p:\Innoverse')
logging.basicConfig(level=logging.DEBUG)

from backend.drive_storage import create_patient_folder, upload_file_to_drive, get_drive_service
service = get_drive_service()

folder_id = create_patient_folder('TEST_UPLOAD')
print(f'Folder ID: {folder_id}')

if folder_id:
    # 2. Create a dummy file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.json', mode='w') as f:
        f.write('{"test": "data"}')
        dummy_path = f.name
        
    print(f'Trying to upload {dummy_path}...')
    try:
        file_id = service.files().create(body={'name': 'test.json', 'parents': [folder_id]}, media_body=dummy_path, fields='id', supportsAllDrives=True).execute()
        print(f'Uploaded File ID: {file_id}')
    except Exception as e:
        import traceback
        traceback.print_exc()
        
    os.remove(dummy_path)
