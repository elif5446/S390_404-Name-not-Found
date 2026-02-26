import { BuildingNavConfig, Node } from "../types/navigation";
import { Route, UserLocation } from "../types/routes";
import { Graph } from "./Graph";
import { PathFinder } from "./PathFinder";
import { LatLng } from "react-native-maps";

export class IndoorMapService{
    private graph: Graph;
    private pathFinder: PathFinder;
    private userLocation: UserLocation | null = null;
    
    constructor(){
        this.graph = new Graph();
        this.pathFinder = new PathFinder(this.graph);
    }

    loadBuilding(config: BuildingNavConfig): void{
        //this will reset the graph everytime a new building is pressed
        this.graph = new Graph();
        this.pathFinder = new PathFinder(this.graph);

        //load the floors
        for (const floor of config.floors){
            for(const node of floor.nodes){
                this.graph.addNode(node);
            }
            for(const edge of floor.edges){
                this.graph.addEdge(edge)
            }
        }

        // add inter-floor edges after all floors are loaded
        // this is done last because inter-floor edges reference nodes on different floors
        // so all nodes must exist in the graph before these edges can be added
        for (const edge of config.interFloorEdges) {
        this.graph.addEdge(edge);
        }
    }

    getRoute(startNodeId: string, endNodeId:string): Route{
        return this.pathFinder.findShortestPath(startNodeId, endNodeId);
    }

    setUserLocation(location: UserLocation): void{
        this.userLocation = location;
    }

    getUserLocation(): UserLocation | null{
        return this.userLocation;
    }


    //will find the closest entrance node to the uses outside GPS location
    findClosestEntrance(userLatLng: LatLng): Node | undefined {
    const entranceNodes = this.graph.getAllNodes().filter(node => node.isEntrance && node.entranceLocation);

    let closestNode: Node  | undefined;
    let closestDistance = Infinity;

    for (const entrance of entranceNodes) {
        const distance = this.calculateGeoDistance(userLatLng, entrance.entranceLocation!);
        if (distance < closestDistance) {
        closestDistance = distance;
        closestNode = entrance;
        }
    }

    return closestNode;
    }
    
    // convenience method that uses the current user location as the start point
    getRouteFromCurrentLocation(endNodeId: string): Route {
        if (!this.userLocation) {
        throw new Error('IndoorMapService: user location not set');
        }
        return this.pathFinder.findShortestPath(this.userLocation.nodeId, endNodeId);
    }
    private calculateGeoDistance(pointA: LatLng, pointB: LatLng): number {
        const R = 6371000; // earth's radius in meters

        // convert latitude and longitude from degrees to radians
        const lat1 = (pointA.latitude * Math.PI) / 180;
        const lat2 = (pointB.latitude * Math.PI) / 180;

        const deltaLat = ((pointB.latitude - pointA.latitude) * Math.PI) / 180;
        const deltaLng = ((pointB.longitude - pointA.longitude) * Math.PI) / 180;

        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // returns distance in meters
        return R * c;
    }

}


