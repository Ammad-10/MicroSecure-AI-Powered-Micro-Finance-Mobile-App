# Running the App on a New Laptop & WiFi

Follow these steps to migrate and run the "AI Micro-Finance App" on a different laptop or a new network environment.

## 1. Prerequisites
Ensure the new laptop has the following installed:
- **Node.js** (v18 or later)
- **Python** (v3.9 or later)
- **Git** (optional, for cloning)
- **Expo Go** app (installed on your physical phone)

## 2. Copy the Project
Copy the entire project folder (`RANA_FYP`) to the new laptop.

## 3. Backend Setup
On the new laptop:
1. Open a terminal in the `backend` folder.
2. Create a virtual environment:
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\activate
   ```
4. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
5. Ensure the `.env` file exists and points to the correct `DB_URL` and `UPLOAD_DIR`.

## 4. Mobile Frontend Setup
On the new laptop:
1. Open a terminal in the `mobile` folder.
2. Install dependencies:
   ```bash
   npm install
   ```

## 5. NETWORK CONFIGURATION (CRITICAL)
Since you are on a new WiFi, the IP address of your laptop has changed. You must update the app to point to the new IP.

1. **Find your new IP**:
   - Open Command Prompt and type: `ipconfig`
   - Look for "IPv4 Address" under your Wireless LAN adapter (e.g., `192.168.10.5`).
2. **Update the App**:
   - Open `mobile/src/services/api.js`.
   - Find the line `const API_BASE_URL = 'http://...:8005';`.
   - Replace the old IP with your **NEW IPv4 address**.
   - Example: `const API_BASE_URL = 'http://192.168.10.5:8005';`

## 6. Running the Application
1. **Start Backend**:
   - In the `backend` terminal (with venv active): `python main.py`
2. **Start Mobile**:
   - In the `mobile` terminal: `npm start`
3. **Connect your Phone**:
   - Ensure your Phone and Laptop are on the **EXACT SAME WiFi**.
   - Scan the QR code with the Expo Go app.

## 7. Troubleshooting
- **Firewall**: If the phone cannot connect, ensure the Windows Firewall on the laptop allows traffic on port **8005** (backend) and **8081** (metro).
- **Public/Private WiFi**: Set your new WiFi network profile to **"Private"** in Windows Settings to allow local network communication.
