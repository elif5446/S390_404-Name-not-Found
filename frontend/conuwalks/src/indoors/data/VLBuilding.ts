import { BuildingNavConfig } from '../types/Navigation';

export const VLBuildingNavConfig: BuildingNavConfig = {
  buildingId: "VL", 
  defaultStartNodeId: "VL_ENTRANCE",
  floors: [
    {
        floorId: "VL_1",
        nodes: [
          //hallway
          {id:"VL_1_N1", floorId: "VL_1", x: 208, y: 874, type: "hallway"},
          {id:"VL_1_N2", floorId: "VL_1", x: 203, y: 794, type: "hallway"},
          {id:"VL_1_N3", floorId: "VL_1", x: 203, y: 667, type: "hallway"},
          {id:"VL_1_N4", floorId: "VL_1", x: 401, y: 664, type: "hallway"},
          {id:"VL_1_N5", floorId: "VL_1", x: 284, y: 523, type: "hallway"},
          {id:"VL_1_N6", floorId: "VL_1", x: 484, y: 480, type: "hallway"},
          {id:"VL_1_N7", floorId: "VL_1", x: 563, y: 595, type: "hallway"},
          {id:"VL_1_N8", floorId: "VL_1", x: 685, y: 632, type: "hallway"},
          {id:"VL_1_N9", floorId: "VL_1", x: 786, y: 527, type: "hallway"},
          {id:"VL_1_N10", floorId: "VL_1", x: 786, y: 664, type: "hallway"},
          {id:"VL_1_N11", floorId: "VL_1", x: 691, y: 390, type: "hallway"},
          {id:"VL_1_N12", floorId: "VL_1", x: 608, y: 352, type: "hallway"},
          {id:"VL_1_N13", floorId: "VL_1", x: 484, y: 346, type: "hallway"},
          {id:"VL_1_N14", floorId: "VL_1", x: 217, y: 346, type: "hallway"},
          {id:"VL_1_N15", floorId: "VL_1", x: 219, y: 201, type: "hallway"},
          {id:"VL_1_N16", floorId: "VL_1", x: 608, y: 154, type: "hallway"},
          {id:"VL_1_N17", floorId: "VL_1", x: 714, y: 147, type: "hallway"},

          //classroom
            //left
          {id: "VL_101.6", floorId: "VL_1", x: 53, y: 805, type: "room", label: "Room 101.06"},
          {id: "VL_101.7", floorId: "VL_1", x: 53, y: 753, type: "room", label: "Room 101.07"},
          {id: "VL_102", floorId: "VL_1", x: 56, y: 670, type: "room", label: "Room 102"},
          {id: "VL_102.2", floorId: "VL_1", x: 154, y: 604, type: "room", label: "Room 102.2"},
          {id: "VL_102.3", floorId: "VL_1", x: 217, y: 604, type: "room", label: "Room 102.3"},

            //bottom
          {id: "VL_101.3", floorId: "VL_1", x: 321, y: 865, type: "room", label: "Room 101.03"},
          {id: "VL_101.4", floorId: "VL_1", x: 321, y: 931, type: "room", label: "Room 101.04"},

            //right
          {id: "VL_104", floorId: "VL_1", x: 675, y: 718, type: "room", label: "Room 104"},
          {id: "VL_103.1", floorId: "VL_1", x: 755, y: 612, type: "room", label: "Room 103.1"},
          {id: "VL_140", floorId: "VL_1", x: 811, y: 781, type: "room", label: "Room 140"},
          {id: "VL_197.1", floorId: "VL_1", x: 818, y: 642, type: "room", label: "Room 197.1"},

            //middle
          {id: "VL_120", floorId: "VL_1", x: 770, y: 350, type: "room", label: "Room 120"},
          {id: "VL_106.1", floorId: "VL_1", x: 770, y: 435, type: "room", label: "Room 106.1"},
          {id: "VL_122", floorId: "VL_1", x: 379, y: 413, type: "room", label: "Room 122"},
          {id: "VL_122.1", floorId: "VL_1", x: 261, y: 428, type: "room", label: "Room 122.1"},
          {id: "VL_124", floorId: "VL_1", x: 261, y: 387, type: "room", label: "Room 124"},

             //top
          {id: "VL_128", floorId: "VL_1", x: 313, y: 252, type: "room", label: "Room 128"},
          {id: "VL_126", floorId: "VL_1", x: 469, y: 252, type: "room", label: "Room 126"},
          {id: "VL_130", floorId: "VL_1", x: 274, y: 186, type: "room", label: "Room 130"},
          {id: "VL_121", floorId: "VL_1", x: 644, y: 81, type: "room", label: "Room 121"},

            //bathrooms
          {id: "VL_BATHROOM_1_W", floorId: "VL_1", x: 746, y: 220, type: "bathroom", label: "Womens Washroom"},
          {id: "VL_BATHROOM_2_W", floorId: "VL_1", x: 671, y: 301, type: "bathroom", label: "Womens Washroom"},
          {id: "VL_BATHROOM_3_M", floorId: "VL_1", x: 671, y: 220, type: "bathroom", label: "Mens Washroom"},
          {id: "VL_BATHROOM_4_M", floorId: "VL_1", x: 746, y: 301, type: "bathroom", label: "Mens Washroom"},

            //stairs
          {id: "VL_STAIRS_1", floorId: "VL_1", x: 820, y: 592, type: "stairs", label: "Stairs"},
          {id: "VL_STAIRS_2", floorId: "VL_1", x: 223, y: 469, type: "stairs", label: "Stairs"},
          {id: "VL_STAIRS_3", floorId: "VL_1", x: 565, y: 257, type: "stairs", label: "Stairs"},

            //elevators
          {id: "VL_ELEVATOR", floorId: "VL_1", x: 225, y: 522, type: "elevator", label: "Elevator"},

          {id: "VL_ENTRANCE", floorId: "VL_1", x: 53, y: 940, type: "entrance", label: "Entrance"},
        ],
        edges: [

          //hallway to hallway
          {nodeAId: "VL_1_N1", nodeBId: "VL_1_N2", accessible: true},
          {nodeAId: "VL_1_N2", nodeBId: "VL_1_N3", accessible: true},
          {nodeAId: "VL_1_N3", nodeBId: "VL_1_N4", accessible: true},
          {nodeAId: "VL_1_N4", nodeBId: "VL_1_N5", accessible: true},
          {nodeAId: "VL_1_N5", nodeBId: "VL_1_N6", accessible: true},
          {nodeAId: "VL_1_N4", nodeBId: "VL_1_N7", accessible: true},
          {nodeAId: "VL_1_N6", nodeBId: "VL_1_N7", accessible: true},
          {nodeAId: "VL_1_N7", nodeBId: "VL_1_N8", accessible: true},

          {nodeAId: "VL_1_N7", nodeBId: "VL_1_N9", accessible: true},
          {nodeAId: "VL_1_N9", nodeBId: "VL_1_N11", accessible: true},
          {nodeAId: "VL_1_N11", nodeBId: "VL_1_N6", accessible: true},

          {nodeAId: "VL_1_N11", nodeBId: "VL_1_N12", accessible: true},
          {nodeAId: "VL_1_N12", nodeBId: "VL_1_N13", accessible: true},
          {nodeAId: "VL_1_N13", nodeBId: "VL_1_N14", accessible: true},
          {nodeAId: "VL_1_N14", nodeBId: "VL_1_N15", accessible: true},
          {nodeAId: "VL_1_N12", nodeBId: "VL_1_N16", accessible: true},
          {nodeAId: "VL_1_N9", nodeBId: "VL_1_N10", accessible: true},
          {nodeAId: "VL_1_N16", nodeBId: "VL_1_N17", accessible: true},

          //hallway to rooms
          {nodeAId: "VL_1_N1", nodeBId: "VL_101.4", accessible: true},
          {nodeAId: "VL_1_N1", nodeBId: "VL_101.3", accessible: true},

          {nodeAId: "VL_1_N2", nodeBId: "VL_101.7", accessible: true},
          {nodeAId: "VL_1_N2", nodeBId: "VL_101.6", accessible: true},

          {nodeAId: "VL_1_N3", nodeBId: "VL_102.2", accessible: true},
          {nodeAId: "VL_1_N3", nodeBId: "VL_102.3", accessible: true},
          {nodeAId: "VL_1_N3", nodeBId: "VL_102", accessible: true},

          {nodeAId: "VL_1_N5", nodeBId: "VL_122", accessible: true},
          {nodeAId: "VL_1_N5", nodeBId: "VL_122.1", accessible: true},
          {nodeAId: "VL_1_N6", nodeBId: "VL_122", accessible: true},

          {nodeAId: "VL_1_N8", nodeBId: "VL_103.1", accessible: true},
          {nodeAId: "VL_1_N8", nodeBId: "VL_104", accessible: true},

          {nodeAId: "VL_1_N10", nodeBId: "VL_197.1", accessible: true},
          {nodeAId: "VL_1_N10", nodeBId: "VL_140", accessible: true},

          {nodeAId: "VL_1_N11", nodeBId: "VL_120", accessible: true},
          {nodeAId: "VL_1_N11", nodeBId: "VL_106.1", accessible: true},

          {nodeAId: "VL_1_N13", nodeBId: "VL_126", accessible: true},
          {nodeAId: "VL_1_N14", nodeBId: "VL_128", accessible: true},
          {nodeAId: "VL_1_N14", nodeBId: "VL_124", accessible: true},

          {nodeAId: "VL_1_N15", nodeBId: "VL_130", accessible: true},
          {nodeAId: "VL_1_N16", nodeBId: "VL_121", accessible: true},

          //hallway to bathroom
          {nodeAId: "VL_1_N16", nodeBId: "VL_BATHROOM_3_M", accessible: true},
          {nodeAId: "VL_1_N17", nodeBId: "VL_BATHROOM_1_W", accessible: true},
          {nodeAId: "VL_1_N12", nodeBId: "VL_BATHROOM_2_W", accessible: true},
          {nodeAId: "VL_1_N11", nodeBId: "VL_BATHROOM_4_M", accessible: true},

          //hallway to interfloor 
          {nodeAId: "VL_1_N5", nodeBId: "VL_ELEVATOR", accessible: true},
          {nodeAId: "VL_1_N5", nodeBId: "VL_STAIRS_2", accessible: true},

          {nodeAId: "VL_1_N9", nodeBId: "VL_STAIRS_1", accessible: false},

          {nodeAId: "VL_1_N12", nodeBId: "VL_STAIRS_3", accessible: false},
          {nodeAId: "VL_1_N16", nodeBId: "VL_STAIRS_3", accessible: false},

        {nodeAId: "VL_ENTRANCE", nodeBId: "VL_1_N1", accessible: true},
        ]
    },
    {
        floorId: "VL_2",
        nodes: [

          //room
           {id: "VL_205", floorId: "VL_2", x: 799, y: 250, type: "room", label:"Room 205"},
           {id: "VL_202.30", floorId: "VL_2", x: 269, y: 412, type: "room", label:"Room 202.30"},
           {id: "VL_203.30", floorId: "VL_2", x: 700, y: 410, type: "room", label:"Room 203.30"},
           {id: "VL_204", floorId: "VL_2", x: 755, y: 410, type: "room", label:"Room 204"},
           {id: "VL_201", floorId: "VL_2", x: 712, y: 590, type: "room", label:"Room 201"},
           {id: "VL_240", floorId: "VL_2", x: 822, y: 774, type: "room", label:"Room 240"},

           //stairs & elevator
           {id: "VL_2_STAIRS_1", floorId: "VL_2", x: 767, y: 789, type: "stairs", label:"Stairs"},
           {id: "VL_2_STAIRS_2", floorId: "VL_2", x: 218, y: 398, type: "stairs", label:"Stairs"},
           {id: "VL_2_STAIRS_3", floorId: "VL_2", x: 561, y: 257, type: "stairs", label:"Stairs"},
           {id: "VL_2_ELEVATOR_1", floorId: "VL_2", x: 225, y: 530, type: "elevator", label:"Elevator"},

           //washroom
           {id: "VL_2_BATHROOM_1_W", floorId: "VL_2", x: 670, y: 219, type: "bathroom", label:"Women Washroom"},
           {id: "VL_2_BATHROOM_1_M", floorId: "VL_2", x: 670, y: 300, type: "bathroom", label:"Men Washroom"},

           //hallayway 
           {id: "VL_2_N1", floorId: "VL_2", x: 290, y: 529, type: "hallway"},
           {id: "VL_2_N2", floorId: "VL_2", x: 561, y: 529, type: "hallway"},
           {id: "VL_2_N3", floorId: "VL_2", x: 561, y: 691, type: "hallway"},
           {id: "VL_2_N4", floorId: "VL_2", x: 613, y: 342, type: "hallway"},
           {id: "VL_2_N5", floorId: "VL_2", x: 613, y: 259, type: "hallway"},
           {id: "VL_2_N6", floorId: "VL_2", x: 756, y: 342, type: "hallway"},
           {id: "VL_2_N7", floorId: "VL_2", x: 751, y: 691, type: "hallway"},
           {id: "VL_2_N8", floorId: "VL_2", x: 237, y: 342, type: "hallway"},
        ],
        edges: [

          //hallway to hallway 
        {nodeAId: "VL_2_N1", nodeBId: "VL_2_N2", accessible: true},
        {nodeAId: "VL_2_N1", nodeBId: "VL_2_N3", accessible: true},
        {nodeAId: "VL_2_N1", nodeBId: "VL_2_N4", accessible: true},
        {nodeAId: "VL_2_N2", nodeBId: "VL_2_N4", accessible: true},
        {nodeAId: "VL_2_N2", nodeBId: "VL_2_N3", accessible: true},
        {nodeAId: "VL_2_N3", nodeBId: "VL_2_N7", accessible: true},
        {nodeAId: "VL_2_N4", nodeBId: "VL_2_N5", accessible: true},
        {nodeAId: "VL_2_N4", nodeBId: "VL_2_N6", accessible: true},
        {nodeAId: "VL_2_N4", nodeBId: "VL_2_N8", accessible: true},

        //room to hallway
        {nodeAId: "VL_205", nodeBId: "VL_2_N6", accessible: true},
        {nodeAId: "VL_203.30", nodeBId: "VL_2_N6", accessible: true},
        {nodeAId: "VL_204", nodeBId: "VL_2_N6", accessible: true},
        {nodeAId: "VL_240", nodeBId: "VL_2_N7", accessible: true},
        {nodeAId: "VL_201", nodeBId: "VL_2_N7", accessible: true},
        {nodeAId: "VL_201", nodeBId: "VL_2_N2", accessible: true},
        {nodeAId: "VL_202.30", nodeBId: "VL_2_N8", accessible: true},
        {nodeAId: "VL_202.30", nodeBId: "VL_2_N1", accessible: true},

        //Stairs & Elevator
        {nodeAId: "VL_2_STAIRS_1", nodeBId: "VL_2_N7", accessible: false},
        {nodeAId: "VL_2_STAIRS_2", nodeBId: "VL_2_N8", accessible: false},
        {nodeAId: "VL_2_STAIRS_3", nodeBId: "VL_2_N5", accessible: false},
        {nodeAId: "VL_2_ELEVATOR_1", nodeBId: "VL_2_N1", accessible: true},

        //bathrooms
        {nodeAId: "VL_2_BATHROOM_1_W", nodeBId: "VL_2_N6", accessible: true},
        {nodeAId: "VL_2_BATHROOM_1_M", nodeBId: "VL_2_N6", accessible: true},

        ]
    }
    
    
  ],
  interFloorEdges:[
    {nodeAId: "VL_STAIRS_1", nodeBId: "VL_2_STAIRS_1", accessible: false},
    {nodeAId: "VL_STAIRS_2", nodeBId: "VL_2_STAIRS_2", accessible: false},
    {nodeAId: "VL_STAIRS_3", nodeBId: "VL_2_STAIRS_3", accessible: false},
    {nodeAId: "VL_ELEVATOR", nodeBId: "VL_2_ELEVATOR_1", accessible: true},
  ]
}
