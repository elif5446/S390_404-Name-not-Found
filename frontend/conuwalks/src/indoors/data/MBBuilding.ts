import { BuildingNavConfig } from '../types/Navigation';

export const MBBuildingNavConfig: BuildingNavConfig = {
  buildingId: "MB", //needs to match the id of the BuildingIndoorConfig
  defaultStartNodeId: "",
  floors: [
    {
      floorId: "MB_S2",
      nodes: [

        //rooms 
        {id: "MB_S2.285", floorId: "MB_S2", x: 794, y: 155, type: "room", label: "Room 285"},
        {id: "MB_S2.210", floorId: "MB_S2", x: 606, y: 360, type: "room", label: "Room 210"},
        {id: "MB_S2.330", floorId: "MB_S2", x: 786, y: 360, type: "room", label: "Room 330"},
        {id: "MB_S2.116", floorId: "MB_S2", x: 500, y: 833, type: "room", label: "Room 116"},
        {id: "MB_S2.105", floorId: "MB_S2", x: 533, y: 955, type: "room", label: "Room 105"},
        {id: "MB_S2.401", floorId: "MB_S2", x: 674, y: 923, type: "room", label: "Room 401"},
        {id: "MB_S2.465", floorId: "MB_S2", x: 810, y: 955, type: "room", label: "Room 465"},
        {id: "MB_S2.455", floorId: "MB_S2", x: 930, y: 944, type: "room", label: "Room 455"},
        {id: "MB_S2.445", floorId: "MB_S2", x: 939, y: 831, type: "room", label: "Room 445"},
        {id: "MB_S2.435", floorId: "MB_S2", x: 885, y: 708, type: "room", label: "Room 435"},
        
        //POI
        //Study Rooms
        {id: "MB_S2.273", floorId: "MB_S2", x: 636, y: 123, type: "room", label: "Study Room"},
        {id: "MB_S2.275", floorId: "MB_S2", x: 674, y: 123, type: "room", label: "Study Room"},
        {id: "MB_S2.279", floorId: "MB_S2", x: 712, y: 123, type: "room", label: "Study Room"},
        {id: "MB_S2.135", floorId: "MB_S2", x: 492, y: 727, type: "room", label: "Study Room"},
        {id: "MB_S2.428", floorId: "MB_S2", x: 810, y: 800, type: "room", label: "Study Room"},
        

        //Washrooms
        {id: "MB_S2_BATHROOM_W", floorId: "MB_S2", x: 639, y: 762, type: "bathroom", label: "Women Washroom"},
        {id: "MB_S2_BATHROOM_M", floorId: "MB_S2", x: 720, y: 762, type: "bathroom", label: "Men Washroom"},
        {id: "MB_S2_BATHROOM_H", floorId: "MB_S2", x: 690, y: 776, type: "bathroom", label: "Handicap Washroom"},
        
        //Food
        {id: "MB_vinhs_cafe", floorId: "MB_S2", x: 442, y: 147, type: "food", label: "Vinh's Cafe"},
        {id: "MB_S2_MIC", floorId: "MB_S2", x: 390, y: 274, type: "food", label: "Microwave"},

        //Help
        {id: "MB_S2.145", floorId: "MB_S2", x: 490, y: 657, type: "helpDesk", label: "Help Desk"},
        


        //interfloor connections (stairs, escalators, elevator)
        {id:"MB_S2_ELEVATOR_1", floorId: "MB_S2", x: 630, y: 635, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR_2", floorId: "MB_S2", x: 672, y: 635, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR_3", floorId: "MB_S2", x: 714, y: 635, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR_4", floorId: "MB_S2", x: 628, y: 555, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR_5", floorId: "MB_S2", x: 670, y: 555, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR_6", floorId: "MB_S2", x: 712, y: 555, type: "elevator", label: "Elevator"},
       
        {id:"MB_S2_ESCALATOR_UP", floorId: "MB_S2", x: 468, y: 567, type: "escalator", label: "Escalator"},
        {id:"MB_S2_ESCALATOR_DOWN", floorId: "MB_S2", x: 491, y: 566, type: "escalator", label: "Escalator"},

        {id:"MB_S2_STAIRS_1", floorId: "MB_S2", x: 579, y: 141, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS_2", floorId: "MB_S2", x: 429, y: 568, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS_3", floorId: "MB_S2", x: 807, y: 635, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS_4", floorId: "MB_S2", x: 794, y: 882, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS_5", floorId: "MB_S2", x: 412, y: 411, type: "stairs", label: "Stairs"},

    
        //hallway
        {id:"MB_S2_N1", floorId: "MB_S2", x: 685, y: 216, type: "hallway"},
        {id:"MB_S2_N2", floorId: "MB_S2", x: 580, y: 214, type: "hallway"},
        {id:"MB_S2_N3", floorId: "MB_S2", x: 524, y: 216, type: "hallway"},
        {id:"MB_S2_N4", floorId: "MB_S2", x: 462, y: 216, type: "hallway"},
        {id:"MB_S2_N5", floorId: "MB_S2", x: 458, y: 461, type: "hallway"},
        {id:"MB_S2_N6", floorId: "MB_S2", x: 520, y: 533, type: "hallway"},
        {id:"MB_S2_N7", floorId: "MB_S2", x: 585, y: 595, type: "hallway"},
        {id:"MB_S2_N8", floorId: "MB_S2", x: 670, y: 595, type: "hallway"},
        {id:"MB_S2_N9", floorId: "MB_S2", x: 724, y: 596, type: "hallway"},
        {id:"MB_S2_N10", floorId: "MB_S2", x: 844, y: 595, type: "hallway"},
        {id:"MB_S2_N11", floorId: "MB_S2", x: 584, y: 719, type: "hallway"},
        {id:"MB_S2_N12", floorId: "MB_S2", x: 585, y: 839, type: "hallway"},
        {id:"MB_S2_N13", floorId: "MB_S2", x: 584, y: 893, type: "hallway"},
        {id:"MB_S2_N14", floorId: "MB_S2", x: 674, y: 839, type: "hallway"},
        {id:"MB_S2_N15", floorId: "MB_S2", x: 770, y: 838, type: "hallway"},
        {id:"MB_S2_N16", floorId: "MB_S2", x: 879, y: 838, type: "hallway"},
        {id:"MB_S2_N17", floorId: "MB_S2", x: 57, y: 491, type: "hallway"},
        
        
        

      ],
      edges: [

        // //hall to hall
        {nodeAId: "MB_S2_N1", nodeBId: "MB_S2_N2", accessible: true},
        {nodeAId: "MB_S2_N2", nodeBId: "MB_S2_N3", accessible: true},
        {nodeAId: "MB_S2_N3", nodeBId: "MB_S2_N4", accessible: true},
        {nodeAId: "MB_S2_N3", nodeBId: "MB_S2_N6", accessible: true},
        {nodeAId: "MB_S2_N4", nodeBId: "MB_S2_N5", accessible: true},
        {nodeAId: "MB_S2_N5", nodeBId: "MB_S2_N17", accessible: true},
        {nodeAId: "MB_S2_N6", nodeBId: "MB_S2_N7", accessible: true},
        {nodeAId: "MB_S2_N7", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_N7", nodeBId: "MB_S2_N11", accessible: true},
        {nodeAId: "MB_S2_N8", nodeBId: "MB_S2_N9", accessible: true},
        {nodeAId: "MB_S2_N9", nodeBId: "MB_S2_N10", accessible: true},
        {nodeAId: "MB_S2_N11", nodeBId: "MB_S2_N12", accessible: true},
        {nodeAId: "MB_S2_N12", nodeBId: "MB_S2_N13", accessible: true},
        {nodeAId: "MB_S2_N12", nodeBId: "MB_S2_N14", accessible: true},
        {nodeAId: "MB_S2_N14", nodeBId: "MB_S2_N15", accessible: true},
        {nodeAId: "MB_S2_N15", nodeBId: "MB_S2_N16", accessible: true},
      
        //room
        {nodeAId: "MB_S2.285", nodeBId: "MB_S2_N1", accessible: true},
        {nodeAId: "MB_S2.330", nodeBId: "MB_S2_N1", accessible: true},
        {nodeAId: "MB_S2.210", nodeBId: "MB_S2_N1", accessible: true},
        {nodeAId: "MB_S2.210", nodeBId: "MB_S2_N7", accessible: true},
        {nodeAId: "MB_S2.210", nodeBId: "MB_S2_N10", accessible: true},
        {nodeAId: "MB_S2.116", nodeBId: "MB_S2_N12", accessible: true},
        {nodeAId: "MB_S2.105", nodeBId: "MB_S2_N13", accessible: true},
        {nodeAId: "MB_S2.401", nodeBId: "MB_S2_N14", accessible: true},
        {nodeAId: "MB_S2.435", nodeBId: "MB_S2_N16", accessible: true},
        {nodeAId: "MB_S2.445", nodeBId: "MB_S2_N16", accessible: true},
        {nodeAId: "MB_S2.455", nodeBId: "MB_S2_N16", accessible: true},
        {nodeAId: "MB_S2.465", nodeBId: "MB_S2_N16", accessible: true},

        //bathrooms
        {nodeAId: "MB_S2_BATHROOM_W", nodeBId: "MB_S2_N14", accessible: true},
        {nodeAId: "MB_S2_BATHROOM_M", nodeBId: "MB_S2_N14", accessible: true},
        {nodeAId: "MB_S2_BATHROOM_H", nodeBId: "MB_S2_N14", accessible: true},

        //POI
        //food
        {nodeAId: "MB_vinhs_cafe", nodeBId: "MB_S2_N4", accessible: true},
        {nodeAId: "MB_S2_MIC", nodeBId: "MB_S2_N4", accessible: true},

        //study room
        {nodeAId: "MB_S2.273", nodeBId: "MB_S2_N1", accessible: true},
        {nodeAId: "MB_S2.275", nodeBId: "MB_S2_N1", accessible: true},
        {nodeAId: "MB_S2.279", nodeBId: "MB_S2_N1", accessible: true},
        {nodeAId: "MB_S2.135", nodeBId: "MB_S2_N11", accessible: true},
        {nodeAId: "MB_S2.428", nodeBId: "MB_S2_N15", accessible: true},


        //help
        {nodeAId: "MB_S2.145", nodeBId: "MB_S2_N7", accessible: true},

        //interfloor connections (stairs, escalators, elevator) to hallway
        {nodeAId: "MB_S2_ELEVATOR_1", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR_2", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR_3", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR_4", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR_5", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR_6", nodeBId: "MB_S2_N8", accessible: true},

        {nodeAId: "MB_S2_ESCALATOR_UP", nodeBId: "MB_S2_N5", accessible: false},
        {nodeAId: "MB_S2_ESCALATOR_DOWN", nodeBId: "MB_S2_N5", accessible: true},
        
        {nodeAId: "MB_S2_STAIRS_1", nodeBId: "MB_S2_N2", accessible: false},
        {nodeAId: "MB_S2_STAIRS_2", nodeBId: "MB_S2_N5", accessible: false},
        {nodeAId: "MB_S2_STAIRS_3", nodeBId: "MB_S2_N9", accessible: false},
        {nodeAId: "MB_S2_STAIRS_4", nodeBId: "MB_S2_N15", accessible: false},
        {nodeAId: "MB_S2_STAIRS_5", nodeBId: "MB_S2_N5", accessible: false},
        
      ]
    },
    {
      floorId: "MB_1",
       nodes: [
         //entrance 
         {id: "MB_1_ENTRANCE_1", floorId: "MB_1", x: 250, y: 129, type: "entrance", label:"Entrance 1"},
         {id: "MB_1_ENTRANCE_2", floorId: "MB_1", x: 341, y: 921, type: "entrance", label:"Entrance 2"},
         {id: "MB_1_ENTRANCE_3", floorId: "MB_1", x: 353, y: 978, type: "entrance", label:"Entrance 3"},
        
         //POI
         {id: "MB_SECURITY", floorId: "MB_1", x: 462, y: 829, type: "helpDesk", label:"Security"},
        
         //food
          {id: "MB_1_SECOND_CUP_CAFE", floorId: "MB_1", x: 623, y: 972, type: "food", label:"Second Cup Cafe"},

        // room
        {id:"MB_1.210", floorId: "MB_1", x: 489, y: 405, type: "room", label: "Room 210"},

        //bathrooms
         {id: "MB_1_BATHROOM_W", floorId: "MB_1", x: 554, y: 802, type: "bathroom", label: "Women Washroom"},
         {id: "MB_1_BATHROOM_M", floorId: "MB_1", x: 625, y: 802, type: "bathroom", label: "Men Washroom"},


         //interfloor connections (stairs, escalators, elevator)
        {id:"MB_1_ELEVATOR_1", floorId: "MB_1", x: 472, y: 653, type: "elevator", label: "Elevator"},
        {id:"MB_1_ELEVATOR_2", floorId: "MB_1", x: 513, y: 653, type: "elevator", label: "Elevator"},
        {id:"MB_1_ELEVATOR_3", floorId: "MB_1", x: 551, y: 653, type: "elevator", label: "Elevator"},
        {id:"MB_1_ELEVATOR_4", floorId: "MB_1", x: 472, y: 569, type: "elevator", label: "Elevator"},
        {id:"MB_1_ELEVATOR_5", floorId: "MB_1", x: 513, y: 569, type: "elevator", label: "Elevator"},
        {id:"MB_1_ELEVATOR_6", floorId: "MB_1", x: 551, y: 569, type: "elevator", label: "Elevator"},

        {id:"MB_1_STAIRS_1", floorId: "MB_1", x: 218, y: 200, type: "stairs", label: "Stairs"},
        {id:"MB_1_STAIRS_2", floorId: "MB_1", x: 369, y: 506, type: "stairs", label: "Stairs"},
        {id:"MB_1_STAIRS_3", floorId: "MB_1", x: 295, y: 805, type: "stairs", label: "Stairs"},

        {id:"MB_1_ESCALATOR_DOWN", floorId: "MB_1", x: 339, y: 801, type: "escalator", label: "Escalator"},
        {id:"MB_1_ESCALATOR", floorId: "MB_1", x: 327, y: 802, type: "escalator", label: "Escalator"},

        //Hallway 
        {id:"MB_1_N1", floorId: "MB_1", x: 457, y: 939, type: "hallway"},
        {id:"MB_1_N2", floorId: "MB_1", x: 586, y: 861, type: "hallway"},
        {id:"MB_1_N3", floorId: "MB_1", x: 391, y: 834, type: "hallway"},
        {id:"MB_1_N4", floorId: "MB_1", x: 373, y: 595, type: "hallway"},
        {id:"MB_1_N5", floorId: "MB_1", x: 513, y: 611, type: "hallway"},
        {id:"MB_1_N6", floorId: "MB_1", x: 318, y: 530, type: "hallway"},
        {id:"MB_1_N7", floorId: "MB_1", x: 313, y: 424, type: "hallway"},
        {id:"MB_1_N8", floorId: "MB_1", x: 370, y: 424, type: "hallway"},
        {id:"MB_1_N9", floorId: "MB_1", x: 369, y: 196, type: "hallway"},
        {id:"MB_1_N10", floorId: "MB_1", x: 300, y: 195, type: "hallway"},

       ],
       edges: [
        
        //hall to hall
        {nodeAId: "MB_1_N1", nodeBId: "MB_1_N2", accessible: true},
        {nodeAId: "MB_1_N1", nodeBId: "MB_1_N3", accessible: true},
        {nodeAId: "MB_1_N3", nodeBId: "MB_1_N4", accessible: true},
        {nodeAId: "MB_1_N4", nodeBId: "MB_1_N5", accessible: true},
        {nodeAId: "MB_1_N4", nodeBId: "MB_1_N6", accessible: true},
        {nodeAId: "MB_1_N6", nodeBId: "MB_1_N7", accessible: true},
        {nodeAId: "MB_1_N7", nodeBId: "MB_1_N8", accessible: true},
        {nodeAId: "MB_1_N7", nodeBId: "MB_1_N10", accessible: false},
        {nodeAId: "MB_1_N8", nodeBId: "MB_1_N9", accessible: true},
        {nodeAId: "MB_1_N9", nodeBId: "MB_1_N10", accessible: true},

        //room to hallway
        {nodeAId: "MB_1_N9", nodeBId: "MB_1.210", accessible: false},
        {nodeAId: "MB_1_N4", nodeBId: "MB_1.210", accessible: false},

        //entrance to hallway
        {nodeAId: "MB_1_ENTRANCE_1", nodeBId: "MB_1_N10", accessible: true},
        {nodeAId: "MB_1_ENTRANCE_2", nodeBId: "MB_1_N1", accessible: true},
        {nodeAId: "MB_1_ENTRANCE_3", nodeBId: "MB_1_N1", accessible: true},

        //interfloor connections (stairs, escalators, elevator) to hallway
        {nodeAId: "MB_1_STAIRS_1", nodeBId: "MB_1_N10", accessible: false},
        {nodeAId: "MB_1_STAIRS_2", nodeBId: "MB_1_N6", accessible: false},
        {nodeAId: "MB_1_STAIRS_2", nodeBId: "MB_1_N4", accessible: false},
        {nodeAId: "MB_1_STAIRS_3", nodeBId: "MB_1_N3", accessible: false},

        {nodeAId: "MB_1_ESCALATOR_DOWN", nodeBId: "MB_1_N3", accessible: false},
        {nodeAId: "MB_1_ESCALATOR", nodeBId: "MB_1_N3", accessible: false},

        {nodeAId: "MB_1_ELEVATOR_1", nodeBId: "MB_1_N5", accessible: true},
        {nodeAId: "MB_1_ELEVATOR_2", nodeBId: "MB_1_N5", accessible: true},
        {nodeAId: "MB_1_ELEVATOR_3", nodeBId: "MB_1_N5", accessible: true},
        {nodeAId: "MB_1_ELEVATOR_4", nodeBId: "MB_1_N5", accessible: true},
        {nodeAId: "MB_1_ELEVATOR_5", nodeBId: "MB_1_N5", accessible: true},
        {nodeAId: "MB_1_ELEVATOR_6", nodeBId: "MB_1_N5", accessible: true},

        //POI to hallway
        {nodeAId: "MB_SECURITY", nodeBId: "MB_1_N1", accessible: true},
        {nodeAId: "MB_SECURITY", nodeBId: "MB_1_N3", accessible: true},
        {nodeAId: "MB_1_SECOND_CUP_CAFE", nodeBId: "MB_1_N1", accessible: true},

        //bathroom to hallway
        {nodeAId: "MB_1_BATHROOM_W", nodeBId: "MB_1_N2", accessible: true},
        {nodeAId: "MB_1_BATHROOM_M", nodeBId: "MB_1_N2", accessible: true},

       ]
     }

   ],
   interFloorEdges: [
    //stairs
    {nodeAId: "MB_1_STAIRS_1", nodeBId: "MB_S2_STAIRS_5", accessible:false},
    {nodeAId: "MB_1_STAIRS_3", nodeBId: "MB_S2_STAIRS_2", accessible:false},
    //escalators
    {nodeAId: "MB_S2_ESCALATOR_UP", nodeBId: "MB_1_ESCALATOR", accessible:false},
    {nodeAId: "MB_1_ESCALATOR_DOWN", nodeBId: "MB_S2_ESCALATOR_DOWN", accessible:false},
    
    //elevator
    {nodeAId: "MB_1_ELEVATOR_1", nodeBId: "MB_S2_ELEVATOR_1", accessible:true},
    {nodeAId: "MB_1_ELEVATOR_2", nodeBId: "MB_S2_ELEVATOR_2", accessible:true},
    {nodeAId: "MB_1_ELEVATOR_3", nodeBId: "MB_S2_ELEVATOR_3", accessible:true},
    {nodeAId: "MB_1_ELEVATOR_4", nodeBId: "MB_S2_ELEVATOR_4", accessible:true},
    {nodeAId: "MB_1_ELEVATOR_5", nodeBId: "MB_S2_ELEVATOR_5", accessible:true},
    {nodeAId: "MB_1_ELEVATOR_6", nodeBId: "MB_S2_ELEVATOR_6", accessible:true},
   ]
 };
