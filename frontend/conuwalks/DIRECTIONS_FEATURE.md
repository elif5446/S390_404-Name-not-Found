# Campus Navigation - Google Maps Directions Feature

This feature allows users to see directions between buildings on the Concordia University campus using Google Maps Directions API.

## Features

- **Building Selection**: Select start and destination buildings from a list
- **Interactive Map**: View the campus map with Google Maps integration
- **Route Display**: See the walking route between selected buildings
- **Clear Markers**: Start building marked in green, destination in red
- **Route Line**: Blue polyline showing the path between buildings

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
4. Create credentials (API Key)
5. (Optional) Restrict the API key to your app's package name for security

### 2. Configure API Key

Replace `YOUR_GOOGLE_MAPS_API_KEY` in the following files with your actual API key:

- `app.json` (3 places: iOS config, Android config, and react-native-maps plugin)
- `app/index.tsx` (GOOGLE_MAPS_API_KEY constant)

Alternatively, you can use environment variables:
1. Copy `.env.example` to `.env`
2. Add your API key to the `.env` file
3. Update the code to read from environment variables

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

For iOS:
```bash
npm run ios
```

For Android:
```bash
npm run android
```

For Web (limited functionality):
```bash
npm run web
```

## Usage

1. Launch the app
2. Select a start building from the horizontal list
3. Select a destination building from the horizontal list
4. The map will automatically display the route between the two buildings
5. Use "Clear Route" to reset and select new buildings
6. Use "Hide Selectors" to maximize map view

## Implementation Details

### Components

- **MapWithDirections**: Main map component that integrates Google Maps and displays directions
  - Uses Google Directions API to fetch routes
  - Decodes polyline from API response
  - Shows markers for start (green) and destination (red)
  - Displays route as a blue polyline

- **BuildingSelector**: Horizontal scrollable list of buildings
  - Allows selection of start and destination
  - Visual feedback for selected building

### Sample Buildings

The app includes sample buildings from Concordia University's SGW Campus:
- Hall Building (H)
- EV Building
- MB Building
- LB Building
- GM Building
- FG Building

You can add more buildings by updating the `BUILDINGS` array in `app/index.tsx`.

## Acceptance Criteria Met

✅ Directions are generated using the Google Directions API
✅ The route is shown clearly on the campus map between the selected buildings
✅ The start and destination are clearly indicated (green for start, red for destination)

## Technical Stack

- React Native with Expo
- react-native-maps for map display
- Google Directions API for route calculation
- TypeScript for type safety
