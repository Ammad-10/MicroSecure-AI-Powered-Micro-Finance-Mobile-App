"""Check ChromaDB for stored face embeddings."""
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
coll = client.get_or_create_collection("faces")

count = coll.count()
print(f"Total embeddings in ChromaDB: {count}")

if count > 0:
    result = coll.get(include=["metadatas"])
    for meta in result["metadatas"]:
        print(f"  CNIC: {meta.get('cnic', 'N/A')}, Image: {meta.get('image_path', 'N/A')}")
else:
    print("No embeddings stored yet.")
