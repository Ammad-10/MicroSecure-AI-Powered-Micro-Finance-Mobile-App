
import requests
import base64
import numpy as np
import io
from PIL import Image

def create_mock_frame(color=(255, 0, 0), size=(100, 100), noise=0):
    """Creates a mock red frame with optional noise."""
    img = Image.new('RGB', size, color)
    if noise > 0:
        pixels = img.load()
        for i in range(size[0]):
            for j in range(size[1]):
                r, g, b = pixels[i, j]
                r = max(0, min(255, r + np.random.randint(-noise, noise)))
                pixels[i, j] = (r, g, b)
    
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

def test_liveness():
    url = "http://127.0.0.1:8005/api/auth/verify-liveness"
    
    print("--- Test 1: Static Red Object ---")
    frames = [create_mock_frame(color=(200, 10, 10), noise=0) for _ in range(5)]
    response = requests.post(url, json={"frames": frames})
    print(f"Status: {response.status_code}")
    print(f"Result: {response.json()}")

    print("\n--- Test 2: Pulsing Biological Tissue (Simulated) ---")
    # Simulate slight variance in red channel
    frames = [create_mock_frame(color=(180 + i*2, 20, 20), noise=2) for i in range(10)]
    response = requests.post(url, json={"frames": frames})
    print(f"Status: {response.status_code}")
    print(f"Result: {response.json()}")

    print("\n--- Test 3: Not Red (Open Ground) ---")
    frames = [create_mock_frame(color=(100, 100, 100), noise=5) for _ in range(5)]
    response = requests.post(url, json={"frames": frames})
    print(f"Status: {response.status_code}")
    print(f"Result: {response.json()}")

    print("\n--- Test 4: Chaotic Motion ---")
    frames = [create_mock_frame(color=(150 + (i % 2) * 50, 30, 30), noise=0) for i in range(10)]
    response = requests.post(url, json={"frames": frames})
    print(f"Status: {response.status_code}")
    print(f"Result: {response.json()}")

if __name__ == "__main__":
    test_liveness()
