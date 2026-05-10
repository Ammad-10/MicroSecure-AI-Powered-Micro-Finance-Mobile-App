import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import base64
import os

class GestureService:
    def __init__(self):
        # Path to the model file
        model_path = os.path.join(os.path.dirname(__file__), "..", "hand_landmarker.task")
        
        # Initialize the hand landmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            num_hands=1,
            min_hand_detection_confidence=0.7,
            min_hand_presence_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

    def decode_image(self, base64_string):
        """Decodes base64 image string to OpenCV BGR image."""
        try:
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None

    def get_landmarks(self, img):
        """Extracts 21 hand landmarks using MediaPipe Tasks API."""
        # Convert the image to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        
        # Detect hand landmarks
        detection_result = self.detector.detect(mp_image)
        
        if detection_result.hand_landmarks:
            # We only care about the first hand detected
            return detection_result.hand_landmarks[0]
        return None

    def classify_gesture(self, landmarks):
        """
        Classifies the gesture based on landmark positions using rotation-invariant logic.
        """
        if not landmarks:
            return "none", 0.0

        # Finger landmark indices: Tip, PIP joint, and Wrist (0)
        tips = [8, 12, 16, 20] 
        pips = [6, 10, 14, 18]
        wrist = landmarks[0]
        
        def dist(l1, l2):
            return np.sqrt((l1.x - l2.x)**2 + (l1.y - l2.y)**2)

        # 1. Check which fingers are extended (Tip is further from wrist than PIP)
        extended = []
        for tip_idx, pip_idx in zip(tips, pips):
            if dist(landmarks[tip_idx], wrist) > dist(landmarks[pip_idx], wrist):
                extended.append(True)
            else:
                extended.append(False)

        # 2. Thumb logic (Landmark 4 vs 2)
        thumb_extended = dist(landmarks[4], wrist) > dist(landmarks[2], wrist)

        # 3. Define Gestures
        # Peace Sign: Index & Middle extended, others folded
        if extended[0] and extended[1] and not extended[2] and not extended[3]:
            return "peace", 0.9

        # Thumbs Up: Only thumb extended
        if thumb_extended and not any(extended):
            return "thumbs_up", 0.9

        # Open Palm: All fingers extended
        if all(extended) and thumb_extended:
            return "open_palm", 0.9
        if all(extended):
             return "open_palm", 0.8

        # One Finger (Index): Only index extended
        if extended[0] and not any(extended[1:]):
            return "one_finger", 0.9

        # OK Sign: Thumb and Index tips are very close
        dist_ok = dist(landmarks[4], landmarks[8])
        if dist_ok < 0.08:
            return "ok", 0.85

        return "unknown", 0.5

    def detect_gesture_in_frame(self, base64_frame):
        """Main entry point for API."""
        img = self.decode_image(base64_frame)
        if img is None:
            print("[GestureService] Failed to decode image")
            return {"gesture": "none", "confidence": 0, "hand_detected": False}

        landmarks = self.get_landmarks(img)
        if not landmarks:
            print("[GestureService] No hand detected in frame")
            return {"gesture": "none", "confidence": 0, "hand_detected": False}

        gesture, confidence = self.classify_gesture(landmarks)
        print(f"[GestureService] Hand detected! Gesture: {gesture} (Conf: {confidence:.2f})")
        
        return {
            "gesture": gesture,
            "confidence": confidence,
            "hand_detected": True
        }

# Singleton instance
# Note: Initializing here might fail if model not found yet. 
# Better to initialize on first use or ensure model is there.
_detector_instance = None

def get_gesture_detector():
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = GestureService()
    return _detector_instance
