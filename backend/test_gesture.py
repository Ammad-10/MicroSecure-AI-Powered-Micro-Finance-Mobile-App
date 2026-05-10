import requests
import base64
import os

# Create a dummy image (1x1 black pixel)
img_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
with open("dummy_hand.jpg", "wb") as f:
    f.write(img_data)

with open("dummy_hand.jpg", "rb") as f:
    encoded_string = base64.b64encode(f.read()).decode('utf-8')

url = "http://localhost:8005/api/auth/detect-gesture"
data = {
    "frames": [encoded_string]
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Request failed: {e}")
finally:
    if os.path.exists("dummy_hand.jpg"):
        os.remove("dummy_hand.jpg")
