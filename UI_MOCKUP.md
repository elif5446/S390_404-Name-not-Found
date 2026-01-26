# Visual UI Mockup - Location Feature

## Screen States

### 1. Permission Request State
```
╔═══════════════════════════════════════╗
║                                       ║
║          CoNU Walks                   ║
║                                       ║
║   ┌─────────────────────────────┐    ║
║   │                             │    ║
║   │  To use your current        │    ║
║   │  location as a starting     │    ║
║   │  point, we need access to   │    ║
║   │  your location.             │    ║
║   │                             │    ║
║   │  ┌───────────────────────┐  │    ║
║   │  │ Enable Location       │  │    ║
║   │  │      Services         │  │    ║
║   │  └───────────────────────┘  │    ║
║   │                             │    ║
║   └─────────────────────────────┘    ║
║                                       ║
╚═══════════════════════════════════════╝
```

### 2. Location Active State (SUCCESS)
```
╔═══════════════════════════════════════╗
║                                       ║
║          CoNU Walks                   ║
║                                       ║
║   ┌─────────────────────────────┐    ║
║   │                             │    ║
║   │    ✓ Location Enabled       │    ║
║   │                             │    ║
║   │  Current Location           │    ║
║   │  (Start Point):             │    ║
║   │                             │    ║
║   │  📍 Latitude: 45.497500     │    ║
║   │  📍 Longitude: -73.578900   │    ║
║   │                             │    ║
║   │  Your current location is   │    ║
║   │  set as the starting point  │    ║
║   │  for your itinerary.        │    ║
║   │                             │    ║
║   └─────────────────────────────┘    ║
║                                       ║
╚═══════════════════════════════════════╝
```

### 3. Permission Denied State
```
╔═══════════════════════════════════════╗
║                                       ║
║          CoNU Walks                   ║
║                                       ║
║   ┌─────────────────────────────┐    ║
║   │                             │    ║
║   │  ❌ Location permission     │    ║
║   │     denied. Please enable   │    ║
║   │     location services in    │    ║
║   │     your device settings.   │    ║
║   │                             │    ║
║   └─────────────────────────────┘    ║
║                                       ║
╚═══════════════════════════════════════╝
```

### 4. Loading State
```
╔═══════════════════════════════════════╗
║                                       ║
║          CoNU Walks                   ║
║                                       ║
║           ⟳                           ║
║    Getting your location...           ║
║                                       ║
╚═══════════════════════════════════════╝
```

## Key Visual Elements

### Colors & Styling:
- **Background**: Light gray (#f5f5f5)
- **Cards**: White with subtle shadow
- **Success**: Green (#4caf50)
- **Error**: Red (#d32f2f)
- **Info**: Gray (#666)

### Typography:
- **Title**: 28px, bold
- **Success Message**: 18px, bold, green
- **Labels**: 16px, semi-bold
- **Body Text**: 14px, regular
- **Coordinates**: 14px, regular

### Icons:
- ✓ - Success indicator
- 📍 - Location pin
- ⟳ - Loading spinner
- ❌ - Error indicator

## Interaction Flow

1. **App Launch** → Check permission status
2. **Permission Undetermined** → Show permission request UI
3. **User Taps Button** → Request permission (native dialog)
4. **Permission Granted** → Fetch location → Show coordinates
5. **Permission Denied** → Show error message

## Real-World Example Coordinates

For Concordia University (Montreal):
- Hall Building: 45.497500, -73.578900
- EV Building: 45.495400, -73.578100
- MB Building: 45.458100, -73.640200

These would be displayed in the app when a user is at these locations.
