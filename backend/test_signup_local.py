
import requests
import base64
import os

# Create a dummy image
if not os.path.exists("test_face.jpg"):
    # Create a 1x1 white pixel standard jpeg
    # This might be invalid for MTCNN? MTCNN needs a face.
    # I should try to download a face image or key in a real base64 string?
    # Or just use a dummy string and see if it fails at decoding?
    # Actually, main.py decodes base64. If I send junk, it fails.
    # If I send a valid image but no face, MTCNN fails (400 Bad Request).
    # That would prove connectivity works.
    
    # Let's use a very small valid base64 image (1x1 pixel)
    # 1x1 red pixel
    img_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
    with open("test_face.jpg", "wb") as f:
        f.write(img_data)

with open("test_face.jpg", "rb") as f:
    encoded_string = base64.b64encode(f.read()).decode('utf-8')

url = "http://localhost:8005/api/auth/signup"
data = {
    "name": "Test User",
    "father_name": "Test Father",
    "date_of_birth": "1990-01-01",
    "email": os.environ.get("TEST_EMAIL", "test_signup_local@example.com"),
    "cnic": os.environ.get("TEST_CNIC", "1111111111114"),
    "username": os.environ.get("TEST_USER", "testuser_local_4"),
    "password": os.environ.get("TEST_PASSWORD", ""),
    "face_image": encoded_string
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
