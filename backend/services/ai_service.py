try:
    from deepface import DeepFace
    import chromadb
    import numpy as np
    import os
    AI_AVAILABLE = True
except ImportError as e:
    print(f"AI Library Error: {e}")
    AI_AVAILABLE = False

if AI_AVAILABLE:
    # Initialize ChromaDB
    CHROMA_DB_PATH = "./chroma_db"
    try:
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        collection = client.get_or_create_collection(name="faces")
        print("DeepFace (ArcFace) & ChromaDB initialized successfully.")
    except Exception as e:
        print(f"AI Init Error: {e}")
        AI_AVAILABLE = False
    
    from PIL import Image
    import io
    import base64

def add_face_embedding(cnic: str, image_path: str):
    """
    Generates a face embedding using DeepFace (ArcFace) and stores it in ChromaDB.
    """
    if not AI_AVAILABLE:
        raise Exception("AI feature is unavailable.")

    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        # Generate embedding using ArcFace
        # enforce_detection=True ensures we only add embeddings if a face is clear
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="opencv", # Reliable and fast
            enforce_detection=True
        )

        if not embedding_objs:
            raise Exception("No face detected in the image.")

        # If multiple faces detected, use the most prominent one
        embedding = embedding_objs[0]["embedding"]

        # Store in Vector DB
        collection.upsert(
            ids=[cnic],
            embeddings=[embedding],
            metadatas=[{"cnic": cnic, "image_path": image_path}]
        )
        
        print(f"Successfully stored ArcFace embedding for CNIC {cnic}")
        return True

    except Exception as e:
        print(f"Error processing face embedding: {str(e)}")
        raise e

def verify_transaction(cnic: str, image_path: str):
    """
    Verifies user identity and emotion for a transaction.
    """
    if not AI_AVAILABLE:
        raise Exception("AI feature is unavailable.")

    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        # 1. Identify User (Face Matching)
        # Generate current embedding
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="opencv",
            enforce_detection=True
        )

        if not embedding_objs:
            return {"verified": False, "message": "No face detected in camera feed", "emotion": "unknown"}

        current_embedding = embedding_objs[0]["embedding"]

        # 2. Retrieve stored embedding
        results = collection.get(ids=[cnic], include=["embeddings"])
        
        if len(results['embeddings']) == 0:
            return {"verified": False, "message": "User face verification data not found", "emotion": "unknown"}
            
        stored_embedding = results['embeddings'][0]
        
        # Calculate Similarity
        # DeepFace ArcFace uses Cosine similarity by default
        a = np.array(current_embedding)
        b = np.array(stored_embedding)
        
        # Cosine distance = 1 - cosine_similarity
        dot_product = np.float64(np.dot(a, b))
        norm_a = np.float64(np.linalg.norm(a))
        norm_b = np.float64(np.linalg.norm(b))
        cosine_sim = float(dot_product / (norm_a * norm_b))
        
        # ArcFace Cosine Threshold: > 0.68 is usually safe for high confidence
        THRESHOLD = 0.60
        
        if cosine_sim < THRESHOLD:
            return {
                "verified": False, 
                "message": f"Identity verification failed (Similarity: {cosine_sim:.2f})", 
                "emotion": "unknown",
                "confidence": float(cosine_sim)
            }

        # 3. Emotion Detection
        try:
            analysis = DeepFace.analyze(
                img_path=image_path, 
                actions=['emotion'], 
                detector_backend='opencv',
                enforce_detection=True # Be stricter
            )
            result = analysis[0]
            detected_emotion = result['dominant_emotion']
            emotion_scores = {k: float(v) for k, v in result['emotion'].items()}
            
            # Log scores for debugging
            print(f"--- Emotion Analysis for {cnic} ---")
            print(f"Dominant: {detected_emotion}")
            print(f"Scores: {emotion_scores}")

            # Sensitivity Boost: Block if Angry or Fearful are dominant
            # OR if they have a significant presence (e.g., > 15%)
            # OR if Sad is over 60%
            is_unsafe = (detected_emotion in ["fear", "angry"]) or \
                        (emotion_scores.get('fear', 0) > 15.0) or \
                        (emotion_scores.get('angry', 0) > 15.0) or \
                        (emotion_scores.get('sad', 0) > 60.0)

            if is_unsafe:
                blocking_emotion = detected_emotion if detected_emotion in ["fear", "angry", "sad"] else \
                                  ("fear" if emotion_scores.get('fear', 0) > emotion_scores.get('angry', 0) else "angry")
                
                # Custom message for sadness as requested
                error_msg = "Transaction blocked: Please smile in the camera for verification" if emotion_scores.get('sad', 0) > 60.0 else \
                           "Transaction blocked: Unsafe environment or duress detected"

                print(f"[SECURITY] Transaction BLOCKED due to emotion: {blocking_emotion}")
                return {
                    "verified": False, 
                    "message": error_msg, 
                    "emotion": blocking_emotion,
                    "confidence": float(cosine_sim),
                    "scores": emotion_scores
                }

        except Exception as e:
            print(f"Emotion Analysis Error for {cnic}: {e}")
            return {
                "verified": False, 
                "message": f"Verification failed: Could not analyze emotions. Please ensure your face is clearly visible.", 
                "emotion": "unknown",
                "confidence": float(cosine_sim)
            }
        
        # This fallback return should ideally not be reached if everything is handled above
        return {
            "verified": True, 
            "message": "Verification successful", 
            "emotion": detected_emotion,
            "confidence": float(cosine_sim),
            "scores": emotion_scores
        }

    except Exception as e:
        print(f"Verification Error: {e}")
        # If face detection fails here, return a clear message
        if "Face could not be detected" in str(e):
            return {"verified": False, "message": "Face could not be detected. Please look at the camera.", "emotion": "unknown"}
        raise e

def analyze_liveness(frames_base64: list[str]):
    """
    Analyzes a sequence of frames for liveness.
    Checks:
    1. Chromacity (Dominant Redness - R >> G, B)
    2. Temporal Variance (Pulse - signal should not be perfectly static)
    """
    import cv2
    import numpy as np
    import base64
    import io

    if not frames_base64 or len(frames_base64) < 3:
        return {"alive": False, "confidence": 0, "message": "Insufficient data"}

    red_intensities = []
    
    try:
        for base64_str in frames_base64:
            # FAST DECODE: Use cv2 instead of PIL (3x faster)
            img_data = base64.b64decode(base64_str)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR) # Decodes to BGR
            
            if img is None: continue
            
            # Extract center ROI
            h, w, _ = img.shape
            r_size = 80 # Smaller ROI for speed
            ch, cw = h // 2, w // 2
            roi = img[ch-r_size:ch+r_size, cw-r_size:cw+r_size]
            
            # Center of ROI mean (BGR -> R is index 2)
            avg_r = np.mean(roi[:, :, 2])
            avg_g = np.mean(roi[:, :, 1])
            avg_b = np.mean(roi[:, :, 0])
            
            red_intensities.append(avg_r)

        if len(red_intensities) < 3:
             return {"alive": False, "confidence": 0, "message": "Failed to decode frames"}

        # 1. Final Chromacity Verification
        avg_total_red = np.mean(red_intensities)
        if avg_total_red < 45:
            return {"alive": False, "confidence": 0, "message": "No biological tissue detected (Low Redness)"}

        # 2. ACTIVE PRESSURE CHECK (Pressure vs Release)
        mid = len(red_intensities) // 2
        phase_a_mean = np.mean(red_intensities[:mid])
        phase_b_mean = np.mean(red_intensities[mid:])
        
        intensity_delta = abs(phase_a_mean - phase_b_mean) / (phase_a_mean if phase_a_mean > 0 else 1)
        
        # Temporal Variance (Pulse)
        cv = np.std(red_intensities) / (np.mean(red_intensities) or 1)
        
        print(f"B-Liveness (Fast): Delta={intensity_delta:.4f}, CV={cv:.4f}")

        # Zone thresholds
        if cv < 0.001:
            return {"alive": False, "confidence": float(cv), "message": "Static object detected (No life signal)"}
        
        if intensity_delta < 0.025:
            return {"alive": False, "confidence": float(intensity_delta), "message": "Pressure response too weak. Press firmly and release."}
            
        if cv > 0.08:
            return {"alive": False, "confidence": float(cv), "message": "Too much movement detected."}

        return {
            "alive": True, 
            "confidence": 0.99 if intensity_delta > 0.04 else 0.85, 
            "message": "Bio-signature verified: Active response detected."
        }

    except Exception as e:
        print(f"Liveness Analysis Error: {e}")
        return {"alive": False, "confidence": 0, "message": f"Error: {str(e)}"}
