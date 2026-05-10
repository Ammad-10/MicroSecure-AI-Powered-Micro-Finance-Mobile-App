from test_emotion import test_emotion
import os

if __name__ == "__main__":
    print("=== AUTOMATED EMOTION DETECTOR TEST ===")
    test_images = [
        ("test_happy.jpg", "Happy (Should Pass)"),
        ("test_angry.png", "Angry (Should Block)"),
        ("test_fear.png", "Fearful (Should Block)")
    ]
    
    for img, desc in test_images:
        if os.path.exists(img):
            print(f"\n>>> TESTING: {desc}")
            test_emotion(img)
        else:
            print(f"\n[!] Missing image: {img}")
    
    print("\n=== TEST COMPLETE ===")
