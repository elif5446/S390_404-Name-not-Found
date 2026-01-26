# UI/UX Design Document - Campus Navigation Feature

## Overview
The Campus Navigation feature provides an intuitive interface for selecting buildings and viewing directions on a map.

## Screen Layout

```
┌─────────────────────────────────────────┐
│  Campus Navigation      [Clear Route]   │  ← Header (Blue background)
├─────────────────────────────────────────┤
│ Select Start Building                   │
│ [Hall Building] [EV Building] [MB...]   │  ← Horizontal scroll
├─────────────────────────────────────────┤
│ Select Destination Building             │
│ [Hall Building] [EV Building] [MB...]   │  ← Horizontal scroll
├─────────────────────────────────────────┤
│        ▼ Hide Selectors                 │  ← Toggle button
├─────────────────────────────────────────┤
│                                         │
│          🗺️ Google Maps View            │
│                                         │
│     📍 Green marker = Start             │
│     📍 Red marker = Destination         │
│     ━━━ Blue line = Route               │
│                                         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ From: Hall Building (H)           │ │
│  │ To: EV Building                   │ │  ← Route info overlay
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Color Scheme

- **Header**: Blue (#2196F3)
- **Start Marker**: Green
- **Destination Marker**: Red
- **Route Line**: Blue (#2196F3), 4px width
- **Selected Building Button**: Blue (#2196F3)
- **Unselected Building Button**: Light Gray (#f0f0f0)

## User Interaction Flow

1. **Initial State**
   - Map displays Concordia SGW campus center
   - No markers or routes visible
   - Building selectors shown

2. **Selecting Start Building**
   - User taps a building from "Select Start Building" list
   - Button highlights in blue
   - Green marker appears on map

3. **Selecting Destination Building**
   - User taps a building from "Select Destination Building" list
   - Button highlights in blue
   - Red marker appears on map
   - Route automatically fetches and displays as blue polyline
   - Route info box appears at bottom

4. **Clearing Route**
   - User taps "Clear Route" button in header
   - All markers and route disappear
   - Building selections reset

5. **Hiding Selectors**
   - User taps "▼ Hide Selectors"
   - Building selector lists slide up
   - Button changes to "▲ Show Selectors"
   - More space for map view

## Responsive Design

- Building buttons scroll horizontally on mobile
- Map scales to fill available space
- Route info overlay positioned at bottom with transparency
- Touch-friendly button sizes (minimum 44x44 points)

## Accessibility Features

- Clear visual distinction between start and destination
- High contrast colors for markers
- Descriptive labels for screen readers
- Touch targets meet accessibility guidelines

## Sample Buildings Included

1. Hall Building (H)
2. EV Building
3. MB Building
4. LB Building
5. GM Building
6. FG Building

## Key Features Highlighted

✅ **Easy Building Selection**: Horizontal scrollable lists
✅ **Clear Visual Markers**: Color-coded start (green) and destination (red)
✅ **Route Visualization**: Blue polyline shows walking path
✅ **Route Information**: Overlay shows selected buildings
✅ **Maximizable Map**: Hide/show selectors for better map view
✅ **Quick Reset**: Clear Route button for easy reselection

## Technical Implementation Notes

- React Native with Expo framework
- Google Maps integration via react-native-maps
- Google Directions API for route calculation
- TypeScript for type safety
- Responsive layout using React Native StyleSheet

## Future UI Enhancements (Not Implemented)

- Distance and estimated time display
- Multiple route options
- Turn-by-turn instructions panel
- Search functionality for buildings
- Favorites/recent routes
- Dark mode support
- Accessibility zoom controls
