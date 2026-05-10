"""
Test signup with a real face image to verify embedding generation.
Downloads a real face photo and sends it as base64 to the signup endpoint.
"""
import requests
import base64
import os
import time
import urllib.request

# Step 1: Download a real face image
print("Downloading a real face image...")
face_url = "https://thispersondoesnotexist.com"
face_path = "test_real_face.jpg"

req = urllib.request.Request(face_url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req) as response, open(face_path, "wb") as out:
    out.write(response.read())

file_size = os.path.getsize(face_path)
print(f"Downloaded face image: {file_size} bytes")

# Step 2: Encode to base64
with open(face_path, "rb") as f:
    face_base64 = base64.b64encode(f.read()).decode("utf-8")

print(f"Base64 length: {len(face_base64)} chars")

# Step 3: Send signup request
t = str(int(time.time()))
cnic = t + "000"
data = {
    "name": "Real Face Test",
    "father_name": "Test Father",
    "date_of_birth": "1995-06-15",
    "email": f"realface_{t}@test.com",
    "cnic": cnic,
    "username": f"realface_{t}",
    "password": os.environ.get("TEST_PASSWORD", ""),
    "face_image": face_base64,
}

print(f"\nSending signup request...")
print(f"  CNIC: {cnic}")
print(f"  Username: realface_{t}")

try:
    r = requests.post("http://localhost:8005/api/auth/signup", json=data, timeout=60)
    print(f"\nStatus Code: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Request failed: {e}")

# Step 4: Check ChromaDB for the embedding
print("\n--- Checking ChromaDB for embeddings ---")
try:
    import chromadb
    client = chromadb.PersistentClient(path="./chroma_db")
    coll = client.get_or_create_collection("faces")
    count = coll.count()
    print(f"Total embeddings in ChromaDB: {count}")

    if count > 0:
        result = coll.get(include=["metadatas"])
        for meta in result["metadatas"]:
            print(f"  CNIC: {meta.get('cnic', 'N/A')}")
    
    # Check specifically for our new CNIC
    specific = coll.get(ids=[cnic], include=["metadatas"])
    if specific["metadatas"]:
        print(f"\n✅ Embedding FOUND for CNIC {cnic}!")
    else:
        print(f"\n❌ Embedding NOT FOUND for CNIC {cnic}")
except Exception as e:
    print(f"ChromaDB check error: {e}")
