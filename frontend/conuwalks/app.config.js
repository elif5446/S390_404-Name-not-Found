export default {
  expo: {
    name: "conuwalks",
    slug: "conuwalks",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "com.conuwalks.app",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "conuwalks needs your location to show you on the map.",
      },
      bundleIdentifier: "com.conuwalks.app",
    },
    android: {
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.conuwalks.app",
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    extra: {
      eas: {
        projectId: "e74d6318-8d99-4f3d-889b-e5e1187a76d5",
      },
    },
    plugins: [
      "expo-router",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.340257679752-6mrlm3n1q8fhplnoj08dvd7fil8a547n",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "./withMapRenderer.js",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
