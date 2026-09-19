# Android APK Generation Guide (Capacitor)

The native Android project has been successfully initialized and synced under `android/`.

## Prerequisites
- **Android Studio** (Hedgehog, Iguana, Koala, or later) installed with Android SDK (API level 33 or 34 recommended)
- **Java Development Kit (JDK 17 or 21)** configured in Android Studio

---

## Steps to Build APK

### Step 1: Open the Project in Android Studio
Run the following command in the project directory, or open Android Studio manually:
```bash
npx cap open android
```
Or in Android Studio: **File → Open → Select folder:**
`C:\Users\vaibhav chopra\AI-Based-Cognitive-Gaming-and-Memory-Assistance-Platform-for-Elderly-Dementia-Patients-in-NER\android`

### Step 2: Allow Gradle Sync
1. Once opened, Android Studio will automatically start syncing Gradle dependencies.
2. Wait until Gradle sync finishes with `BUILD SUCCESSFUL`.

### Step 3: Build Debug APK (For Testing & Sideloading)
1. In the top menu, go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
2. Android Studio will compile the native code and pack the web assets.
3. Once completed, a popup notification will appear at the bottom right:
   * Click **"locate"** to open the generated APK file.
   * Path: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: (Optional) Build Signed Release APK (For Distribution)
1. In Android Studio, select **Build → Generate Signed Bundle / APK...**
2. Choose **APK** → Click **Next**.
3. Create a new Keystore or choose an existing one.
4. Select build variant `release` and signature versions (V1 and V2 Full APK Signature).
5. Click **Finish**. Output APK will be placed in `android/app/release/`.

### Step 5: Sideload / Install on Android Device
Connect your Android phone/tablet via USB (with Developer Options & USB Debugging enabled) and run:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
Or directly click the green **Run** (▶) button in Android Studio with your device selected.
