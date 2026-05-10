# React Native Setup Guide for Windows

## Current Status
✅ **Backend**: Running on http://127.0.0.1:8000  
✅ **Frontend Dependencies**: Installed (933 packages)  
✅ **API Configuration**: Updated for Android emulator  
❌ **Android Development Environment**: Not installed

---

## Required Software

### 1. Android Studio
Android Studio is required to run React Native apps on Android.

**Download**: https://developer.android.com/studio

**Installation Steps:**
1. Download Android Studio from the link above
2. Run the installer
3. During installation, make sure to select:
   - ✅ Android SDK
   - ✅ Android SDK Platform
   - ✅ Android Virtual Device (AVD)
4. Complete the installation

### 2. Android SDK Configuration

After installing Android Studio:

1. **Open Android Studio**
2. Click on "More Actions" → "SDK Manager"
3. In the "SDK Platforms" tab, install:
   - ✅ Android 13.0 (Tiramisu) - API Level 33
   - ✅ Android 12.0 (S) - API Level 31
4. In the "SDK Tools" tab, install:
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
   - ✅ Intel x86 Emulator Accelerator (HAXM installer)

### 3. Environment Variables

You need to set up environment variables:

1. **Open System Environment Variables:**
   - Press `Win + R`
   - Type `sysdm.cpl` and press Enter
   - Go to "Advanced" tab → "Environment Variables"

2. **Add ANDROID_HOME:**
   - Click "New" under "User variables"
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
   - Replace `YOUR_USERNAME` with your actual username

3. **Update Path:**
   - Find "Path" in "User variables" and click "Edit"
   - Click "New" and add these paths:
     ```
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\emulator
     %ANDROID_HOME%\tools
     %ANDROID_HOME%\tools\bin
     ```

4. **Verify Installation:**
   - Open a **NEW** PowerShell window
   - Run: `adb version`
   - You should see the ADB version info

### 4. Create Android Virtual Device (AVD)

1. Open Android Studio
2. Click "More Actions" → "Virtual Device Manager"
3. Click "Create Device"
4. Select a phone (e.g., Pixel 5)
5. Select a system image (e.g., API 33 - Android 13.0)
6. Click "Finish"
7. Start the emulator by clicking the play button

---

## Running the App

Once Android Studio and the emulator are set up:

### Option A: Using React Native CLI (Recommended)

1. **Start the Metro bundler:**
   ```bash
   cd c:\Users\shahb\Desktop\RANA_FYP\mobile
   npm start
   ```

2. **In a new terminal, run the app:**
   ```bash
   cd c:\Users\shahb\Desktop\RANA_FYP\mobile
   npx react-native run-android
   ```

### Option B: Using npm scripts

```bash
cd c:\Users\shahb\Desktop\RANA_FYP\mobile
npm run android
```

---

## Alternative: Expo (Easier Setup)

If you want a quicker way to test without Android Studio:

### 1. Convert to Expo
```bash
cd c:\Users\shahb\Desktop\RANA_FYP\mobile
npx expo install
```

### 2. Install Expo Go on your phone
- Download "Expo Go" from Play Store (Android) or App Store (iOS)

### 3. Run the app
```bash
npx expo start
```

### 4. Scan QR code
- Scan the QR code with Expo Go app
- The app will run on your physical device

**Note**: Expo requires some code changes (camera library compatibility), but it's much easier for testing.

---

## Troubleshooting

### "adb not found"
- Make sure you've added Android SDK paths to environment variables
- Restart PowerShell/Terminal after adding environment variables
- Verify with: `adb version`

### "No emulator found"
- Start the Android emulator from Android Studio
- Or run: `emulator -avd YOUR_AVD_NAME`

### "Unable to connect to development server"
- Make sure Metro bundler is running (`npm start`)
- Check that the API URL in `src/services/api.js` is correct
- For emulator: `http://10.0.2.2:8000`
- For physical device: `http://YOUR_COMPUTER_IP:8000`

### Camera not working
- Camera requires physical device or special emulator setup
- For testing, you can temporarily skip face image capture
- Or use Expo Go on a physical device

---

## Quick Test (Without Full Setup)

If you want to test the backend immediately without setting up React Native:

1. **Open browser**: http://127.0.0.1:8000/docs
2. **Test Signup endpoint**:
   - Click on `POST /api/auth/signup`
   - Click "Try it out"
   - Fill in the sample data
   - Execute

This lets you verify the backend works while you set up the mobile environment.

---

## Estimated Setup Time

- **Android Studio Installation**: 30-45 minutes
- **SDK Download**: 15-30 minutes
- **Environment Setup**: 5-10 minutes
- **First App Build**: 10-15 minutes

**Total**: ~1-2 hours for first-time setup

---

## Next Steps

1. ✅ Install Android Studio
2. ✅ Configure Android SDK
3. ✅ Set environment variables
4. ✅ Create and start emulator
5. ✅ Run the app with `npm run android`

Once setup is complete, the app will launch on the emulator and you can test the signup/login flow!
