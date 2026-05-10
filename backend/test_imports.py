try:
    print("Importing torch...")
    import torch
    print(f"Torch Version: {torch.__version__}")
    
    print("Importing facenet_pytorch...")
    from facenet_pytorch import MTCNN, InceptionResnetV1
    print("Facenet-PyTorch Imported")
    
    print("Importing chromadb...")
    import chromadb
    print("ChromaDB Imported")
    
    print("SUCCESS: All libraries available.")
except ImportError as e:
    print(f"Imports FAILED: {e}")
except Exception as e:
    print(f"Other Error: {e}")
