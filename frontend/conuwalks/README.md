## Dependencies

Setup `.env.local` with:

- `GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

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

1. `cd frontend/conuwalks`
2. Install dependencies

   ```bash
   npm install
   ```

3. Start the app

   ```bash
   npx expo start
   ```

4. Scan QR code to run Expo Go on your mobile phone or press w to open browser view

Note: If running expo go at school you need to either

- `npx expo start --tunnel`
- or connect your phone and laptop to your own personal data

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

5. Running the app after integrating Google Calendar

   5.1 You will need 3 keys in an .env file with 3 client IDs: Web, iOS and Android. Contact the team to get these IDs.

   5.2 A development build must be set up for Android and iOS because Expo Go and Google Calendar are not compatible. Scanning the QR Code won't work, you will need to open a simulator on your computer. There is a link just above to help.
   Install:
   `npx expo install expo-dev-client`
   OR
   `eas build --platform all --profile development` THEN `eas build --platform ios --profile development-simulator`
   Run the app: `npx expo start --dev-client`

   5.3 To run the app on an Android emulator, you need to generate (or get) a SHA-1 fingerprint (different for every device) and the owner of the Cloud Console (Elif Sag Sesen) must register your device as an Android client.

   Method 1:

   iOS: `cd android && ./gradlew signingReport`
   Android: `cd android && gradlew signingReport`
   Look for the line SHA1, copy it and send it to the Cloud console owner.

   Method 2 - EAS (Expo Application Services):
   Setup eas (if not already done):

   ```npm install -g eas cli
      eas login
      eas build:configure
      eas credentials
   ```

   Look for the line SHA1.

   5.4 Make sure that the file 'google.services.json' is in your project root directory. Contact the team if it is not there.

   5.5 To log in via Google, you must use these credentials since only one account has been added as a tester email:
   Email: testerjohn602@gmail.com
   Password: JohnTester5446

## Run E2E Maestro tests

Note: APP_ID is the android/ios appID; see app.config.js.

```bash
cd frontend/conuwalks
# run all tests
maestro test .maestro/flows/ --env APP_ID=com.anonymous.conuwalks
# run specific
maestro test .maestro/flows/feature-building-details.yaml --env APP_ID=com.anonymous.conuwalks
# record
maestro record --local .maestro/flows/smoke-launch.yaml --env APP_ID=com.anonymous.conuwalks
```

## Learn more

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
