
import os
import sys
from PIL import Image
import io

# Modify sys.path to ensure we can import from local directory
sys.path.append(os.getcwd())

try:
    from services import ai_service
except ImportError:
    # Try adjusting path if running from inside backend
    sys.path.append(os.path.join(os.getcwd(), 'services'))
    import ai_service

def test_embedding():
    print("Testing AI Service...")
    
    # Create a dummy image
    img = Image.new('RGB', (200, 200), color=(200, 160, 130))
    img_path = "debug_face.jpg"
    img.save(img_path)
    
    cnic = "9999999999999"
    
    try:
        print("Calling add_face_embedding...")
        ai_service.add_face_embedding(cnic, img_path)
        print("Success!")
    except Exception as e:
        print("\nCAUGHT EXCEPTION:")
        import traceback
        traceback.print_exc()
    finally:
        if os.path.exists(img_path):
            os.remove(img_path)

if __name__ == "__main__":
    test_embedding()
