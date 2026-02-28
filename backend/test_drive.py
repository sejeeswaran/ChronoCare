
import logging
logging.basicConfig(level=logging.DEBUG)
from backend.drive_storage import create_patient_folder
try:
    print('Calling create_patient_folder')
    res = create_patient_folder('TEST_123')
    print('Result:', res)
except Exception as e:
    import traceback
    traceback.print_exc()

