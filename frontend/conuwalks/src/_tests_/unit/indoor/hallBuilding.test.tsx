import { IndoorMapService } from '@/src/indoors/services/IndoorMapService';
import { IndoorLocationTracker } from '@/src/indoors/services/IndoorLocationTracker';
import { hallBuildingNavConfig } from '@/src/indoors/data/HallBuilding';
import { MBBuildingNavConfig } from '@/src/indoors/data/MBBuilding';

describe('Hall Building Navigation', () => {
  let service: IndoorMapService;
  let locationTracker: IndoorLocationTracker;

  beforeEach(() => {
    service = new IndoorMapService();
    service.loadBuilding(hallBuildingNavConfig);
    //locationTracker = new IndoorLocationTracker(service.getGraph());
    //locationTracker.setDefaultLocation(hallBuildingNavConfig.defaultStartNodeId);
  });

  test('find the route between H_964 and H_801', async() => {
   
    const route = await service.getRoute('H_822', 'H_8_STAIRS_4');
    console.log('Path:', route?.nodes.map(n => n.id).join(' → '));
    console.log('Total distance:', route?.totalDistance);
  });

  // test('find the route from the default start node to H_964', () => {
  //   const userLocation = locationTracker.getUserLocation();
  //   const route = service.getRoute(userLocation!.nodeId, 'H_964');
  //   console.log('Path:', route.nodes.map(n => n.id).join(' → '));
  //   console.log('Total distance:', route.totalDistance);
  // });
});
