function useDestinationSync(
  buildingData: BuildingIndoorConfig,
  destinationBuildingId: string | null | undefined,
  destinationRoomId: string | null | undefined,
  hotspots: IndoorHotspot[],
  isNavigationActive: boolean | undefined,
  baseStartNode: Node | null,
  currentLevel: number,
  handleFloorChange: (level: number) => void,
) {
  const [destination, setDestination] = useState<IndoorDestination | null>(null);
  const lastSyncedDestRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Handle clearing the destination
    if (!destinationBuildingId || destinationBuildingId !== buildingData.id || !destinationRoomId) {
      setDestination(null);
      lastSyncedDestRef.current = null; // Clear the ref so it can be selected again later
      return;
    }

    if (!baseStartNode || destinationRoomId === lastSyncedDestRef.current) return;

    const cleanInput = destinationRoomId.toLowerCase().replace(/[^a-z0-9]/g, "");
    let targetNode: IndoorDestination | undefined;

    // 2. Search in Standard Rooms (Hotspots)
    targetNode = hotspots.find(spot => {
      const spotId = spot.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const spotLabel = (spot.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return spotId === cleanInput || spotLabel === cleanInput || spotId.endsWith(cleanInput) || spotLabel.endsWith(cleanInput);
    });

    // 3. If not in hotspots, search ALL NavGraph nodes (Bathrooms, Food, Stairs, Elevators)
    if (!targetNode) {
      const navConfig = navConfigRegistry[buildingData.id];
      if (navConfig) {
        for (const navFloor of navConfig.floors) {
          const foundNode = navFloor.nodes.find(n => {
            if (n.id === destinationRoomId) return true; // Exact match priority
            const nId = n.id.toLowerCase().replace(/[^a-z0-9]/g, "");
            const nLabel = (n.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return nId === cleanInput || nLabel === cleanInput || nId.endsWith(cleanInput) || nLabel.endsWith(cleanInput);
          });

          if (foundNode) {
            const visualFloor = buildingData.floors.find(f => f.id === navFloor.floorId);
            targetNode = {
              id: foundNode.id,
              x: foundNode.x,
              y: foundNode.y,
              floorLevel: visualFloor ? visualFloor.level : buildingData.defaultFloor,
              label: foundNode.label ?? foundNode.id,
            };
            break;
          }
        }
      }
    }

    // 4. Fallback for purely visual/explicit POIs
    if (!targetNode) {
      for (const floor of buildingData.floors) {
        const pois = getPOIsForFloor(buildingData.id, floor.level);
        const foundPoi = pois.find(p => p.id === destinationRoomId || p.room === destinationRoomId);
        if (foundPoi) {
          const fallbackWidth = (floor as any).width ?? 1024;
          const fallbackHeight = (floor as any).height ?? 1024;
          targetNode = {
            id: foundPoi.id,
            x: Math.round(foundPoi.mapPosition.x * fallbackWidth),
            y: Math.round(foundPoi.mapPosition.y * fallbackHeight),
            floorLevel: floor.level,
            label: foundPoi.label,
          };
          break;
        }
      }
    }

    // 5. Apply the resolved target
    if (targetNode) {
      setDestination(targetNode);
      lastSyncedDestRef.current = destinationRoomId;
      const targetLevel = isNavigationActive ? buildingData.floors.find(f => f.id === baseStartNode.floorId)?.level : targetNode.floorLevel;

      if (targetLevel !== undefined && currentLevel !== targetLevel) {
        setTimeout(() => handleFloorChange(targetLevel), 100);
      }
    } else {
      setDestination(null);
    }
  }, [
    destinationBuildingId,
    destinationRoomId,
    buildingData.id,
    buildingData.floors,
    buildingData.defaultFloor,
    hotspots,
    isNavigationActive,
    baseStartNode,
    currentLevel,
    handleFloorChange,
  ]);

  return { destination, setDestination };
}
