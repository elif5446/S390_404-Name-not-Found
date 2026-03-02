# Project Setup

## Dependencies

Setup `.env.local` with:

- `GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_I`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

## How to Build for Android

```sh
#set Java version to 17
sudo update-alternatives --config java

cd frontend/conuwalks
npm install
# generate the native android directory
npx expo prebuild --platform android
cd android
chmod +x gradlew
./gradlew assembleDebug # or ./gradlew assembleRelease
cd ..
npm run android # npx expo start --dev-client

# when code changes re-run
npx expo prebuild --platform android --clean
npm run android
```

## How to run

```bash
cd frontend/conuwalks
# Install dependencies
npm install

npx expo start
# If running expo go at school you need to either
npx expo start --tunnel
# or connect your phone and laptop to your own personal data
# 
```

References:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

### Running the app after integrating Google Calendar

You will need 3 keys in an .env file with 3 client IDs: Web, iOS and Android. Contact the team to get these IDs.

A development build must be set up for Android and iOS because Expo Go and Google Calendar are not compatible.
Scanning the QR Code won't work, you will need to open a simulator on your computer. There is a link just above to help.
   Install:
   `npx expo install expo-dev-client`
   OR
   `eas build --platform all --profile development` THEN `eas build --platform ios --profile development-simulator`
   Run the app: `npx expo start --dev-client`

To run the app on an Android emulator, you need to generate (or get) a SHA-1 fingerprint (different for every device) and the owner of the Cloud Console (Elif Sag Sesen) must register your device as an Android client.

Method 1:

`cd android && ./gradlew signingReport`
Look for the line SHA1, copy it and send it to the Cloud console owner.

Method 2 - EAS (Expo Application Services):
Setup eas (if not already done):

```sh
npm install -g eas cli
eas login
eas build:configure
eas credentials
```

Look for the line SHA1.

Make sure that the file 'google.services.json' is in your project root directory. Contact the team if it is not there.

:warning: Google Login Credentials:

   Email: <testerjohn602@gmail.com><br>
   Password: JohnTester5446

## Run E2E Maestro tests

```bash
cd frontend/conuwalks
# run all tests
maestro test .maestro/flows/ -e PASSWORD=JohnTester5446 -e USERNAME=testerjohn602@gmail.com -e PASSWORD=JohnTester5446
# run specific
maestro test .maestro/flows/feature-building-details.yaml -e USERNAME=testerjohn602@gmail.com -e PASSWORD=JohnTester5446
# record
maestro record --local .maestro/flows/smoke-launch.yaml -e USERNAME=testerjohn602@gmail.com -e PASSWORD=JohnTester5446
```

## Run local tests with Mock Data

```sh
# Example mock data for calendar found in _tests_/mock/

1. Build and Install the app on your simulator<br>
2. Close the app<br>
3. Restart with env var in another terminal ex:<br>
EXPO_PUBLIC_MOCK_CALENDAR=true npx expo start

# or pass the flag to the app 
1. Add EXPO_PUBLIC_MOCK_CALENDAR=true to your local .env
2. android: adb shell am start -n com.conuwals.app/.MainActivity --ez isMockCalendarEnabled true
   iOS: xcrun simctl launch booted com.conuwalks.app -isMockCalendarEnabled true
```
