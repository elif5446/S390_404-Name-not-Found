import { BuildingNavConfig } from '../types/Navigation';

export const MBBuildingNavConfig: BuildingNavConfig = {
  buildingId: "MB", //needs to match the id of the BuildingIndoorConfig
  defaultStartNodeId: "MB_start",
  floors: [
    {
      floorId: "MB_S2",
      nodes: [

        {id: "MB_start", floorId: "MB_S2", x: 57, y: 491, type: "entrance"},

        //rooms 
        {id: "MB_S2.285", floorId: "MB_S2", x: 794, y: 155, type: "room", label: "Room 285"},
        {id: "MB_S2.210", floorId: "MB_S2", x: 606, y: 360, type: "room", label: "Room 210"},
        {id: "MB_S2.330", floorId: "MB_S2", x: 786, y: 360, type: "room", label: "Room 330"},
        {id: "MB_S2.116", floorId: "MB_S2", x: 500, y: 833, type: "room", label: "Room 116"},
        {id: "MB_S2.105", floorId: "MB_S2", x: 533, y: 955, type: "room", label: "Room 105"},
        {id: "MB_S2.401", floorId: "MB_S2", x: 674, y: 923, type: "room", label: "Room 401"},
        {id: "MB_S2.465", floorId: "MB_S2", x: 810, y: 955, type: "room", label: "Room 265"},
        {id: "MB_S2.455", floorId: "MB_S2", x: 930, y: 944, type: "room", label: "Room 455"},
        {id: "MB_S2.445", floorId: "MB_S2", x: 939, y: 831, type: "room", label: "Room 445"},
        {id: "MB_S2.435", floorId: "MB_S2", x: 885, y: 708, type: "room", label: "Room 435"},
        
        //POI
        //Study Rooms
        {id: "MB_S2.273", floorId: "H_S2", x: 636, y: 123, type: "room", label: "Study Room"},
        {id: "MB_S2.275", floorId: "H_S2", x: 674, y: 123, type: "room", label: "Study Room"},
        {id: "MB_S2.279", floorId: "H_S2", x: 712, y: 123, type: "room", label: "Study Room"},
        {id: "MB_S2.135", floorId: "H_S2", x: 492, y: 727, type: "room", label: "Study Room"},
        {id: "MB_S2.428", floorId: "H_S2", x: 810, y: 800, type: "room", label: "Study Room"},
        

        //Washrooms
        {id: "MB_S2_BATHROOM_W", floorId: "H_S2", x: 639, y: 762, type: "bathroom", label: "Women Washroom"},
        {id: "MB_S2_BATHROOM_M", floorId: "H_S2", x: 720, y: 762, type: "bathroom", label: "Men Washroom"},
        {id: "MB_S2_BATHROOM_H", floorId: "H_S2", x: 690, y: 776, type: "bathroom", label: "Handicap Washroom"},
        
        //Food
        {id: "MB_S2.245", floorId: "H_S2", x: 442, y: 147, type: "food", label: "Vinh's Cafe"},
        {id: "MB_S2_MIC", floorId: "H_S2", x: 390, y: 274, type: "food", label: "Microwave"},

        //Help
        {id: "MB_S2.145", floorId: "H_S2", x: 490, y: 657, type: "helpDesk", label: "Help Desk"},
        


        //interfloor connections (stairs, escalators, elevator)
        {id:"MB_S2_ELEVATOR1", floorId: "MB_S2", x: 630, y: 635, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR2", floorId: "MB_S2", x: 672, y: 635, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR3", floorId: "MB_S2", x: 714, y: 635, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR4", floorId: "MB_S2", x: 628, y: 555, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR5", floorId: "MB_S2", x: 670, y: 555, type: "elevator", label: "Elevator"},
        {id:"MB_S2_ELEVATOR6", floorId: "MB_S2", x: 712, y: 555, type: "elevator", label: "Elevator"},
       
        {id:"MB_S2_ESCALATOR_UP", floorId: "MB_S2", x: 468, y: 567, type: "escalator", label: "Escalator"},
        {id:"MB_S2_ESCALATOR_DOWN", floorId: "MB_S2", x: 491, y: 566, type: "escalator", label: "Escalator"},

        {id:"MB_S2_STAIRS1", floorId: "MB_S2", x: 579, y: 141, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS2", floorId: "MB_S2", x: 429, y: 568, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS3", floorId: "MB_S2", x: 807, y: 635, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS4", floorId: "MB_S2", x: 794, y: 882, type: "stairs", label: "Stairs"},
        {id:"MB_S2_STAIRS5", floorId: "MB_S2", x: 412, y: 411, type: "stairs", label: "Stairs"},

    
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
        {nodeAId: "MB_S2.245", nodeBId: "MB_S2_N4", accessible: true},
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
        {nodeAId: "MB_S2_ELEVATOR1", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR2", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR3", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR4", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR5", nodeBId: "MB_S2_N8", accessible: true},
        {nodeAId: "MB_S2_ELEVATOR6", nodeBId: "MB_S2_N8", accessible: true},

        {nodeAId: "MB_S2_STAIRS1", nodeBId: "MB_S2_N5", accessible: true},
        {nodeAId: "MB_S2_ESCALATOR_UP", nodeBId: "MB_S2_N5", accessible: false},
        {nodeAId: "MB_S2_ESCALATOR_DOWN", nodeBId: "MB_S2_N5", accessible: true},
        
        {nodeAId: "MB_S2_STAIRS1", nodeBId: "MB_S2_N2", accessible: false},
        {nodeAId: "MB_S2_STAIRS2", nodeBId: "MB_S2_N5", accessible: false},
        {nodeAId: "MB_S2_STAIRS3", nodeBId: "MB_S2_N9", accessible: false},
        {nodeAId: "MB_S2_STAIRS4", nodeBId: "MB_S2_N15", accessible: false},
        {nodeAId: "MB_S2_STAIRS5", nodeBId: "MB_S2_N5", accessible: false},
        










      
      ]
    },
    {
      floorId: "MB_1",
       nodes: [
         //entrance 
         {id: "MB_1_Entrance1", floorId: "MB_1", x: 250, y: 129, type: "entrance"},
         {id: "MB_1_Entrance2", floorId: "MB_1", x: 341, y: 921, type: "entrance"},
         {id: "MB_1_Entrance3", floorId: "MB_1", x: 353, y: 978, type: "entrance"},


//         {id: "H_9_N2", floorId: "H_9", x: 850, y: 219, type: "hallway"},
//         {id: "H_9_N3", floorId: "H_9", x: 670, y: 219, type: "hallway"},
//         {id: "H_9_N4", floorId: "H_9", x: 853, y: 291, type: "hallway"},
//         {id: "H_9_N5", floorId: "H_9", x: 853, y: 391, type: "hallway"},
//         {id: "H_9_N6", floorId: "H_9", x: 855, y: 497, type: "hallway"},
//         {id: "H_9_N7", floorId: "H_9", x: 819, y: 523, type: "hallway"},
//         {id: "H_9_N8", floorId: "H_9", x: 819, y: 659, type: "hallway"},
//         {id: "H_9_N9", floorId: "H_9", x: 618, y: 660, type: "hallway"},
//         {id: "H_9_N10", floorId: "H_9", x: 660, y: 725, type: "hallway"},
//         {id: "H_9_N11", floorId: "H_9", x: 708, y: 839, type: "hallway"},
//         {id: "H_9_N12", floorId: "H_9", x: 819, y: 839, type: "hallway"},
//         {id: "H_9_N13", floorId: "H_9", x: 397, y: 662, type: "hallway"},
//         {id: "H_9_N14", floorId: "H_9", x: 399, y: 798, type: "hallway"},
//         {id: "H_9_N15", floorId: "H_9", x: 389, y: 891, type: "hallway"},
//         {id: "H_9_N16", floorId: "H_9", x: 324, y: 900, type: "hallway"},
//         {id: "H_9_N17", floorId: "H_9", x: 234, y: 900, type: "hallway"},
//         {id: "H_9_N18", floorId: "H_9", x: 147, y: 900, type: "hallway"},
//         {id: "H_9_N19", floorId: "H_9", x: 79, y: 900, type: "hallway"},
//         {id: "H_9_N20", floorId: "H_9", x: 79, y: 803, type: "hallway"},
//         {id: "H_9_N21", floorId: "H_9", x: 79, y: 711, type: "hallway"},
//         {id: "H_9_N22", floorId: "H_9", x: 79, y: 619, type: "hallway"},
//         {id: "H_9_N23", floorId: "H_9", x: 79, y: 537, type: "hallway"},
//         {id: "H_9_N24", floorId: "H_9", x: 300, y: 660, type: "hallway"},
//         {id: "H_9_N25", floorId: "H_9", x: 524, y: 402, type: "hallway"},
//         {id: "H_9_N26", floorId: "H_9", x: 179, y: 400, type: "hallway"},
//         {id: "H_9_N27", floorId: "H_9", x: 179, y: 330, type: "hallway"},
//         {id: "H_9_N28", floorId: "H_9", x: 179, y: 218, type: "hallway"},
//         {id: "H_9_N29", floorId: "H_9", x: 327, y: 218, type: "hallway"},
//         {id: "H_9_N30", floorId: "H_9", x: 524, y: 218, type: "hallway"},
//         {id: "H_9_N31", floorId: "H_9", x: 79, y: 660, type: "hallway"},
//         {id: "H_9_N32", floorId: "H_9", x: 525, y: 659, type: "hallway"},
//         {id: "H_9_N33", floorId: "H_9", x: 942, y: 646, type: "hallway"},



//         //rooms 
//           //Left side 
//           {id: "H_967", floorId: "H_9", x: 73, y: 166, type: "room"},
//           {id: "H_965", floorId: "H_9", x: 74, y: 328, type: "room"},
//           {id: "H_963", floorId: "H_9", x: 74, y: 440, type: "room"},
//           {id: "H_961.01", floorId: "H_9", x: 32, y: 510, type: "room"},
//           {id: "H_961.02", floorId: "H_9", x: 115, y: 512, type: "room"},
//           {id: "H_961.03", floorId: "H_9", x: 32, y: 581, type: "room"},
//           {id: "H_961.04", floorId: "H_9", x: 115, y: 554, type: "room"},
//           {id: "H_961.06", floorId: "H_9", x: 115, y: 598, type: "room"},
//           {id: "H_961.07", floorId: "H_9", x: 32, y: 644, type: "room"},
//           {id: "H_961.09", floorId: "H_9", x: 32, y: 695, type: "room"},
//           {id: "H_961.11", floorId: "H_9", x: 32, y: 738, type: "room"},
//           {id: "H_961.13", floorId: "H_9", x: 32, y: 785, type: "room"},
//           {id: "H_961.15", floorId: "H_9", x: 32, y: 828, type: "room"},
//           {id: "H_961.17", floorId: "H_9", x: 32, y: 869, type: "room"},
//           {id: "H_961.19", floorId: "H_9", x: 32, y: 933, type: "room"},


//           //Right side
//           {id: "H_917", floorId: "H_9", x: 937, y: 118, type: "room"},
//           {id: "H_919", floorId: "H_9", x: 937, y: 240, type: "room"},
//           {id: "H_921", floorId: "H_9", x: 937, y: 327, type: "room"},
//           {id: "H_923", floorId: "H_9", x: 939, y: 434, type: "room"},
//           {id: "H_925.01", floorId: "H_9", x: 895, y: 536, type: "room"},
//           {id: "H_925.02", floorId: "H_9", x: 966, y: 547, type: "room"},
//           {id: "H_925.03", floorId: "H_9", x: 885, y: 580, type: "room"},
//           {id: "H_927", floorId: "H_9", x: 934, y: 732, type: "room"},
//           {id: "H_927.04", floorId: "H_9", x: 879, y: 641, type: "room"},
//           {id: "H_927.01", floorId: "H_9", x: 978, y: 664, type: "room"},
//           {id: "H_927.03", floorId: "H_9", x: 978, y: 619, type: "room"},
//           {id: "H_931", floorId: "H_9", x: 848, y: 836, type: "room"},
//           {id: "H_929", floorId: "H_9", x: 916, y: 883, type: "room"},

//           //Bottom
//           {id: "H_961.21", floorId: "H_9", x: 81, y: 940, type: "room"},
//           {id: "H_961.23", floorId: "H_9", x: 122, y: 940, type: "room"},
//           {id: "H_961.25", floorId: "H_9", x: 167, y: 940, type: "room"},
//           {id: "H_961.27", floorId: "H_9", x: 212, y: 940, type: "room"},
//           {id: "H_961.29", floorId: "H_9", x: 257, y: 940, type: "room"},
//           {id: "H_961.31", floorId: "H_9", x: 301, y: 940, type: "room"},
//           {id: "H_961.33", floorId: "H_9", x: 346, y: 940, type: "room"},
//           {id: "H_941", floorId: "H_9", x: 423, y: 933, type: "room"},
//           {id: "H_937", floorId: "H_9", x: 543, y: 798, type: "room"},
//           {id: "H_933", floorId: "H_9", x: 753, y: 911, type: "room"},
//           {id: "H_932", floorId: "H_9", x: 738, y: 805, type: "room"},
//           {id: "H_928", floorId: "H_9", x: 789, y: 805, type: "room"},

//           //top
//           {id: "H_903", floorId: "H_9", x: 235, y: 112, type: "room"},
//           {id: "H_907", floorId: "H_9", x: 409, y: 112, type: "room"},
//           {id: "H_909", floorId: "H_9", x: 544, y: 112, type: "room"},
//           {id: "H_911", floorId: "H_9", x: 632, y: 112, type: "room"},
//           {id: "H_913", floorId: "H_9", x: 729, y: 112, type: "room"},
//           {id: "H_915", floorId: "H_9", x: 821, y: 113, type: "room"},

//           //middle
//           {id: "H_964", floorId: "H_9", x: 282, y: 488, type: "room"},
//           {id: "H_968", floorId: "H_9", x: 227, y: 604, type: "room"},
//           {id: "H_966", floorId: "H_9", x: 359, y: 604, type: "room"},
//           {id: "H_962", floorId: "H_9", x: 369, y: 489, type: "room"},

//           {id: "H_961.14", floorId: "H_9", x: 140, y: 780, type: "room"},
//           {id: "H_961.26", floorId: "H_9", x: 143, y: 857, type: "room"},
//           {id: "H_961.28", floorId: "H_9", x: 218, y: 854, type: "room"},
//           {id: "H_961.30", floorId: "H_9", x: 259, y: 853, type: "room"},
//           {id: "H_943", floorId: "H_9", x: 330, y: 853, type: "room"},
//           {id: "H_945", floorId: "H_9", x: 290, y: 798, type: "room"},
//           {id: "H_920", floorId: "H_9", x: 658, y: 469, type: "room"},


//         //POI
//           //bathroom
//           {id: "H_9_BATHROOM_1", floorId: "H_9", x: 355, y: 282, type: "bathroom"},
//           {id: "H_9_BATHROOM_2", floorId: "H_9", x: 629, y: 293, type: "bathroom"},
          

//         //interfloor connections (stais, escalators, elevator)
//         {id: "H_9_STAIRS_1", floorId: "H_9", x: 307, y: 365, type: "stairs", label: "Stairwell"},
//         {id: "H_9_STAIRS_2", floorId: "H_9", x: 709, y: 727, type: "stairs", label: "Stairwell"},
//         {id: "H_9_STAIRS_3", floorId: "H_9", x: 295, y: 724, type: "stairs", label: "Stairwell"},
//         {id: "H_9_STAIRS_4", floorId: "H_9", x: 714, y: 291, type: "stairs", label: "Stairwell"},

//         {id: "H_9_ELEVATOR", floorId: "H_9", x: 358, y: 356, type: "elevator", label: "Elevator"},

//         {id: "H_9_ESCALATOR_DOWN", floorId: "H_9", x: 480, y: 444, type: "escalator", label: "Escalator Down"},
//         {id: "H_9_ESCALATOR_UP", floorId: "H_9", x: 515, y: 444, type: "escalator", label: "Escalator UP"},


       ],
       edges: [
//         //hall to hall
//         {nodeAId: "H_9_N1", nodeBId: "H_9_N25", accessible: true},
//         {nodeAId: "H_9_N1", nodeBId: "H_9_N26", accessible: true},
//         {nodeAId: "H_9_N26", nodeBId: "H_9_N27", accessible: true},
//         {nodeAId: "H_9_N27", nodeBId: "H_9_N28", accessible: true},
//         {nodeAId: "H_9_N27", nodeBId: "H_9_N28", accessible: true},
//         {nodeAId: "H_9_N28", nodeBId: "H_9_N29", accessible: true},
//         {nodeAId: "H_9_N29", nodeBId: "H_9_N30", accessible: true},
//         {nodeAId: "H_9_N30", nodeBId: "H_9_N25", accessible: true},

//         {nodeAId: "H_9_N30", nodeBId: "H_9_N3", accessible: true},
//         {nodeAId: "H_9_N3", nodeBId: "H_9_N2", accessible: true},
//         {nodeAId: "H_9_N2", nodeBId: "H_9_N4", accessible: true},
//         {nodeAId: "H_9_N4", nodeBId: "H_9_N5", accessible: true},
//         {nodeAId: "H_9_N5", nodeBId: "H_9_N6", accessible: true},
//         {nodeAId: "H_9_N6", nodeBId: "H_9_N7", accessible: true},
//         {nodeAId: "H_9_N7", nodeBId: "H_9_N8", accessible: true},
//         {nodeAId: "H_9_N8", nodeBId: "H_9_N9", accessible: true},
//         {nodeAId: "H_9_N9", nodeBId: "H_9_N32", accessible: true},

//         {nodeAId: "H_9_N8", nodeBId: "H_9_N12", accessible: true},
//         {nodeAId: "H_9_N12", nodeBId: "H_9_N11", accessible: true},
//         {nodeAId: "H_9_N11", nodeBId: "H_9_N10", accessible: true},
//         {nodeAId: "H_9_N10", nodeBId: "H_9_N9", accessible: true},

//         {nodeAId: "H_9_N32", nodeBId: "H_9_N25", accessible: true},
//         {nodeAId: "H_9_N32", nodeBId: "H_9_N13", accessible: true},
//         {nodeAId: "H_9_N13", nodeBId: "H_9_N14", accessible: true},
//         {nodeAId: "H_9_N14", nodeBId: "H_9_N15", accessible: true},
//         {nodeAId: "H_9_N15", nodeBId: "H_9_N16", accessible: true},
//         {nodeAId: "H_9_N15", nodeBId: "H_9_N16", accessible: true},
//         {nodeAId: "H_9_N16", nodeBId: "H_9_N17", accessible: true},
//         {nodeAId: "H_9_N17", nodeBId: "H_9_N18", accessible: true},
//         {nodeAId: "H_9_N18", nodeBId: "H_9_N19", accessible: true},
//         {nodeAId: "H_9_N19", nodeBId: "H_9_N20", accessible: true},
//         {nodeAId: "H_9_N20", nodeBId: "H_9_N21", accessible: true},
//         {nodeAId: "H_9_N21", nodeBId: "H_9_N31", accessible: true},
//         {nodeAId: "H_9_N31", nodeBId: "H_9_N22", accessible: true},
//         {nodeAId: "H_9_N22", nodeBId: "H_9_N23", accessible: true},
//         {nodeAId: "H_9_N31", nodeBId: "H_9_N24", accessible: true},
//         {nodeAId: "H_9_N24", nodeBId: "H_9_N13", accessible: true},

//         //hall to class 
//         {nodeAId: "H_9_N1", nodeBId: "H_964", accessible: true},

//         {nodeAId: "H_9_N2", nodeBId: "H_915", accessible: true},
//         {nodeAId: "H_9_N2", nodeBId: "H_917", accessible: true},

//         {nodeAId: "H_9_N3", nodeBId: "H_911", accessible: true},
//         {nodeAId: "H_9_N3", nodeBId: "H_913", accessible: true},

//         {nodeAId: "H_9_N4", nodeBId: "H_919", accessible: true},
//         {nodeAId: "H_9_N4", nodeBId: "H_921", accessible: true},

//         {nodeAId: "H_9_N5", nodeBId: "H_923", accessible: true},
//         {nodeAId: "H_9_N5", nodeBId: "H_920", accessible: true},

//         {nodeAId: "H_9_N6", nodeBId: "H_925.01", accessible: true},
//         {nodeAId: "H_9_N6", nodeBId: "H_925.02", accessible: true},
//         {nodeAId: "H_9_N6", nodeBId: "H_925.03", accessible: true},

//         {nodeAId: "H_9_N8", nodeBId: "H_927", accessible: true},
//         {nodeAId: "H_9_N8", nodeBId: "H_927.04", accessible: true},

//         {nodeAId: "H_9_N10", nodeBId: "H_937", accessible: true},

//         {nodeAId: "H_9_N11", nodeBId: "H_932", accessible: true},
//         {nodeAId: "H_9_N11", nodeBId: "H_933", accessible: true},

//         {nodeAId: "H_9_N12", nodeBId: "H_928", accessible: true},
//         {nodeAId: "H_9_N12", nodeBId: "H_931", accessible: true},
//         {nodeAId: "H_9_N12", nodeBId: "H_929", accessible: true},

//         {nodeAId: "H_9_N13", nodeBId: "H_937", accessible: true},
//         {nodeAId: "H_9_N14", nodeBId: "H_945", accessible: true},
//         {nodeAId: "H_9_N15", nodeBId: "H_941", accessible: true},

//         {nodeAId: "H_9_N16", nodeBId: "H_943", accessible: true},
//         {nodeAId: "H_9_N16", nodeBId: "H_961.33", accessible: true},
//         {nodeAId: "H_9_N16", nodeBId: "H_961.31", accessible: true},

//         {nodeAId: "H_9_N17", nodeBId: "H_961.30", accessible: true},
//         {nodeAId: "H_9_N17", nodeBId: "H_961.28", accessible: true},
//         {nodeAId: "H_9_N17", nodeBId: "H_961.27", accessible: true},
//         {nodeAId: "H_9_N17", nodeBId: "H_961.29", accessible: true},

//         {nodeAId: "H_9_N18", nodeBId: "H_961.26", accessible: true},
//         {nodeAId: "H_9_N18", nodeBId: "H_961.23", accessible: true},
//         {nodeAId: "H_9_N18", nodeBId: "H_961.25", accessible: true},

//         {nodeAId: "H_9_N19", nodeBId: "H_961.21", accessible: true},
//         {nodeAId: "H_9_N19", nodeBId: "H_961.19", accessible: true},
//         {nodeAId: "H_9_N19", nodeBId: "H_961.17", accessible: true},

//         {nodeAId: "H_9_N20", nodeBId: "H_961.13", accessible: true},
//         {nodeAId: "H_9_N20", nodeBId: "H_961.15", accessible: true},
//         {nodeAId: "H_9_N20", nodeBId: "H_961.14", accessible: true},

//         {nodeAId: "H_9_N21", nodeBId: "H_961.09", accessible: true},
//         {nodeAId: "H_9_N21", nodeBId: "H_961.11", accessible: true},

//         {nodeAId: "H_9_N22", nodeBId: "H_961.07", accessible: true},
//         {nodeAId: "H_9_N22", nodeBId: "H_961.03", accessible: true},
//         {nodeAId: "H_9_N22", nodeBId: "H_961.06", accessible: true},

//         {nodeAId: "H_9_N23", nodeBId: "H_961.01", accessible: true},
//         {nodeAId: "H_9_N23", nodeBId: "H_961.02", accessible: true},
//         {nodeAId: "H_9_N23", nodeBId: "H_961.04", accessible: true},

//         {nodeAId: "H_9_N24", nodeBId: "H_968", accessible: true},
//         {nodeAId: "H_9_N24", nodeBId: "H_966", accessible: true},

//         {nodeAId: "H_9_N26", nodeBId: "H_963", accessible: true},
//         {nodeAId: "H_9_N27", nodeBId: "H_965", accessible: true},
//         {nodeAId: "H_9_N28", nodeBId: "H_967", accessible: true},

//         {nodeAId: "H_9_N29", nodeBId: "H_903", accessible: true},
//         {nodeAId: "H_9_N29", nodeBId: "H_907", accessible: true},
//         {nodeAId: "H_9_N30", nodeBId: "H_909", accessible: true},

//         {nodeAId: "H_9_N33", nodeBId: "H_927.04", accessible: true},
//         {nodeAId: "H_9_N33", nodeBId: "H_927.01", accessible: true},
//         {nodeAId: "H_9_N33", nodeBId: "H_927.03", accessible: true},
//         {nodeAId: "H_9_N33", nodeBId: "H_927", accessible: true},

//         //hall to POI
//         {nodeAId: "H_9_N29", nodeBId: "H_9_BATHROOM_1", accessible: true},
//         {nodeAId: "H_9_N3", nodeBId: "H_9_BATHROOM_2", accessible: true},


//         //hall to interfloor connection 
//         {nodeAId: "H_9_ELEVATOR", nodeBId: "H_9_N1" , accessible: true},

//         {nodeAId: "H_9_STAIRS_1", nodeBId: "H_9_N1" , accessible: false},
//         {nodeAId: "H_9_STAIRS_2", nodeBId: "H_9_N9" , accessible: false},
//         {nodeAId: "H_9_STAIRS_3", nodeBId: "H_9_N24" , accessible: false},
//         {nodeAId: "H_9_STAIRS_4", nodeBId: "H_9_N3" , accessible: false},

//         {nodeAId: "H_9_ESCALATOR_DOWN", nodeBId: "H_9_N25" , accessible: false},
//         {nodeAId: "H_9_ESCALATOR_UP", nodeBId: "H_9_N25" , accessible: false},



       ]
     }

   ],
   interFloorEdges: [
//     // edges that connect floors
//     {nodeAId: "H_8_ELEVATOR", nodeBId: "H_9_ELEVATOR", accessible: true},

//     {nodeAId: "H_8_STAIRS_1", nodeBId: "H_9_STAIRS_1", accessible: false},
//     {nodeAId: "H_8_STAIRS_2", nodeBId: "H_9_STAIRS_3", accessible: false},
//     {nodeAId: "H_8_STAIRS_3", nodeBId: "H_9_STAIRS_2", accessible: false},
//     {nodeAId: "H_8_STAIRS_4", nodeBId: "H_9_STAIRS_4", accessible: false},
    
//     {nodeAId: "H_9_ESCALATOR_DOWN", nodeBId: "H_8_ESCALATOR_DOWN", accessible: false},
//     {nodeAId: "H_8_ESCALATOR_UP", nodeBId: "H_9_ESCALATOR_UP", accessible: false},

   ]
 };
