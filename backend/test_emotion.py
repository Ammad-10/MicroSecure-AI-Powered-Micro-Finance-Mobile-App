import sys
import os
from deepface import DeepFace

def test_emotion(image_path):
    print(f"Analyzing emotions in: {image_path}")
    if not os.path.exists(image_path):
        print("Error: Image file not found.")
        return

    try:
        # actions=['emotion'] tells DeepFace to analyze emotions
        # detector_backend='opencv' is the same as used in the main app
        results = DeepFace.analyze(
            img_path=image_path, 
            actions=['emotion'],
            detector_backend='opencv',
            enforce_detection=True
        )
        
        # Results is a list (in case of multiple faces)
        for i, result in enumerate(results):
            emotion = result['dominant_emotion']
            scores = result['emotion']
            
            print(f"\n--- Face {i+1} ---")
            print(f"Dominant Emotion: {emotion.upper()}")
            print("\nEmotion Scores:")
            for e, score in scores.items():
                print(f"  {e:10}: {score:0.2f}%")
            
            if emotion in ["fear", "angry"]:
                print("\n[SECURITY ALERT] This emotion would BLOCK a transaction.")
            else:
                print("\n[INFO] This emotion would ALLOW a transaction.")
                
    except Exception as e:
        print(f"Analysis failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_emotion.py <path_to_image>")
        # Default test if no arg provided and test image exists
        if os.path.exists("test_real_face.jpg"):
            test_emotion("test_real_face.jpg")
    else:
        test_emotion(sys.argv[1])
