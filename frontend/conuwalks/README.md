
## Dependencies

Setup .env with GOOGLE_MAPS_API_KEY

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
npx run android # npx expo start --dev-client

# when code changes re-run
npx expo prebuild --platform android --clean
npx run android
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


