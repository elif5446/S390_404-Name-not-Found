import { BuildingNavConfig } from '../types/Navigation';

export const hallBuildingNavConfig: BuildingNavConfig = {
  buildingId: "H", //needs to match the id of the BuildingIndoorConfig
  defaultStartNodeId: "H_start",
  floors: [
    {
      floorId: "H_8",
      nodes: [

        {id: "H_start", floorId: "H_8", x: 306, y: 394, type: "entrance"},
        //halways 
        {id: "H_8_N1", floorId: "H_8", x: 177, y: 806, type: "hallway"},
        {id: "H_8_N2", floorId: "H_8", x: 176, y: 394, type: "hallway"},
        {id: "H_8_N3", floorId: "H_8", x: 176, y: 211, type: "hallway"},
        {id: "H_8_N4", floorId: "H_8", x: 549, y: 211, type: "hallway"},
        {id: "H_8_N5", floorId: "H_8", x: 549, y: 394, type: "hallway"},
        {id: "H_8_N6", floorId: "H_8", x: 549, y: 806, type: "hallway"},
        {id: "H_8_N13", floorId: "H_8", x: 176, y: 563, type: "hallway"},
        {id: "H_8_N14", floorId: "H_8", x: 91, y: 806, type: "hallway"},
        {id: "H_8_N15", floorId: "H_8", x: 294, y: 806, type: "hallway"},
        {id: "H_8_N16", floorId: "H_8", x: 411, y: 806, type: "hallway"},
        {id: "H_8_N17", floorId: "H_8", x: 343, y: 211, type: "hallway"},
        {id: "H_8_N18", floorId: "H_8", x: 549, y: 617, type: "hallway"},
        {id: "H_8_N19", floorId: "H_8", x: 175, y: 696, type: "hallway"},
        {id: "H_8_N20", floorId: "H_8", x: 343, y: 163, type: "hallway"},
        



        {id: "H_8_N7", floorId: "H_8", x: 688, y: 806, type: "hallway"},
        {id: "H_8_N8", floorId: "H_8", x: 849, y: 806, type: "hallway"},
        {id: "H_8_N9", floorId: "H_8", x: 849, y: 555, type: "hallway"},
        {id: "H_8_N10", floorId: "H_8", x: 849, y: 370, type: "hallway"},
        {id: "H_8_N11", floorId: "H_8", x: 849, y: 211, type: "hallway"},
        {id: "H_8_N12", floorId: "H_8", x: 686, y: 211, type: "hallway"},
        {id: "H_8_N21", floorId: "H_8", x: 650, y: 806, type: "hallway"},


        //rooms 
        
          //top
        {id: "H_801", floorId: "H_8", x: 200, y: 114, type: "room", label: "Room 801"},
        {id: "H_803", floorId: "H_8", x: 293, y: 115, type: "room", label: "Room 803"},
        {id: "H_805.02", floorId: "H_8", x: 379, y: 122, type: "room", label: "Room 805.02"},
        {id: "H_805.01", floorId: "H_8", x: 379, y: 163, type: "room", label: "Room 805.01"},
        {id: "H_805.03", floorId: "H_8", x: 379, y: 75, type: "room", label: "Room 805.03"},
        {id: "H_807", floorId: "H_8", x: 457, y: 115, type: "room", label: "Room 807"},
        {id: "H_811", floorId: "H_8", x: 648, y: 115, type: "room", label: "Room 811"},
        {id: "H_813", floorId: "H_8", x: 736, y: 115, type: "room", label: "Room 813"},
        {id: "H_815", floorId: "H_8", x: 823, y: 115, type: "room", label: "Room 815"},
          //left
        {id: "H_867", floorId: "H_8", x: 60, y: 116, type: "room", label: "Room 867"},
        {id: "H_865", floorId: "H_8", x: 74, y: 171, type: "room", label: "Room 865"},
        {id: "H_863", floorId: "H_8", x: 74, y: 233, type: "room", label: "Room 863"},
        {id: "H_861", floorId: "H_8", x: 74, y: 320, type: "room", label: "Room 861"},
        {id: "H_859", floorId: "H_8", x: 74, y: 412, type: "room", label: "Room 859"},
        {id: "H_857", floorId: "H_8", x: 74, y: 506, type: "room", label: "Room 857"},
        {id: "H_855", floorId: "H_8", x: 74, y: 593, type: "room", label: "Room 855"},
        {id: "H_853", floorId: "H_8", x: 74, y: 687, type: "room", label: "Room 853"},
        {id: "H_851.02", floorId: "H_8", x: 51, y: 755, type: "room", label: "Room 851.02"},
        {id: "H_851.01", floorId: "H_8", x: 122, y: 756, type: "room", label: "Room 851.01"},
        {id: "H_851.03", floorId: "H_8", x: 51, y: 806, type: "room", label: "Room 851.03"},
        {id: "H_849", floorId: "H_8", x: 79, y: 902, type: "room", label: "Room 849"},

          //bottom
        {id: "H_845", floorId: "H_8", x: 287, y: 902, type: "room", label: "Room 845"},
        {id: "H_847", floorId: "H_8", x: 200, y: 902, type: "room", label: "Room 847"},
        {id: "H_843", floorId: "H_8", x: 379, y: 902, type: "room", label: "Room 843"},
        {id: "H_841", floorId: "H_8", x: 475, y: 902, type: "room", label: "Room 841"},
        {id: "H_837", floorId: "H_8", x: 648, y: 902, type: "room", label: "Room 837"},
        {id: "H_835", floorId: "H_8", x: 740, y: 902, type: "room", label: "Room 845"},
        {id: "H_833", floorId: "H_8", x: 832, y: 902, type: "room", label: "Room 833"},
        {id: "H_831", floorId: "H_8", x: 950, y: 902, type: "room", label: "Room 831"},
          //right
        {id: "H_829", floorId: "H_8", x: 950, y: 714.5, type: "room", label: "Room 829"},
        {id: "H_827", floorId: "H_8", x: 950, y: 600, type: "room", label: "Room 827"},
        {id: "H_825", floorId: "H_8", x: 950, y: 506, type: "room", label: "Room 825"},
        {id: "H_823", floorId: "H_8", x: 950, y: 416, type: "room", label: "Room 823"},
        {id: "H_821", floorId: "H_8", x: 950, y: 324, type: "room", label: "Room 821"},
        {id: "H_819", floorId: "H_8", x: 950, y: 234, type: "room", label: "Room 819"},
        {id: "H_817", floorId: "H_8", x: 950, y: 115, type: "room", label: "Room 817"},
        
          //middle section
        {id: "H_852", floorId: "H_8", x: 250, y: 656, type: "room", label: "Room 852"},
        {id: "H_854", floorId: "H_8", x: 263, y: 595, type: "room", label: "Room 854"},
        {id: "H_862", floorId: "H_8", x: 378, y: 490, type: "room", label: "Room 862"},
        {id: "H_842", floorId: "H_8", x: 378, y: 595, type: "room", label: "Room 842"},

        {id: "H_820", floorId: "H_8", x: 686, y: 456, type: "room", label: "Room 820"},
        {id: "H_822", floorId: "H_8", x: 757, y: 607, type: "room", label: "Room 822"},
        {id: "H_832.06", floorId: "H_8", x: 650, y: 606, type: "room", label: "Room 832.06"},
        
        //POI
        {id: "H_8_BATHROOM_1", floorId: "H_8", x: 376, y: 289, type: "bathroom", label: "Bathroom"},
        {id: "H_8_BATHROOM_2", floorId: "H_8", x: 638, y: 289, type: "bathroom", label: "Bathroom"},



        //interfloor connections (stais, escalators, elevator)
        {id:"H_8_ELEVATOR", floorId: "H_8", x: 340, y: 352, type: "elevator", label: "Elevator"},
        {id: "H_8_STAIRS_1", floorId: "H_8", x: 306, y: 359, type: "stairs", label: "Stairwell"},
        {id: "H_8_STAIRS_2", floorId: "H_8", x: 297, y: 727, type: "stairs", label: "Stairwell"},
        {id: "H_8_STAIRS_3", floorId: "H_8", x: 714, y: 727, type: "stairs", label: "Stairwell"},
        {id: "H_8_STAIRS_4", floorId: "H_8", x: 714, y: 289, type: "stairs", label: "Stairwell"},
        {id: "H_8_ESCALATOR_UP", floorId: "H_8", x: 488, y: 431, type: "escalator", label: "Escalator moving up"},
        {id: "H_8_ESCALATOR_DOWN", floorId: "H_8", x: 488, y: 617, type: "escalator", label: "Escalator moving dowm"},



      ],
      edges: [

        //hall to hall
        {nodeAId: "H_8_N3", nodeBId: "H_8_N2", accessible: true},
        {nodeAId: "H_8_N3", nodeBId: "H_8_N17", accessible: true},
        {nodeAId: "H_8_N17", nodeBId: "H_8_N4", accessible: true},
        {nodeAId: "H_8_N2", nodeBId: "H_start", accessible: true},
        {nodeAId: "H_start", nodeBId: "H_8_N5", accessible: true},
        {nodeAId: "H_8_N4", nodeBId: "H_8_N5", accessible: true},
        {nodeAId: "H_8_N2", nodeBId: "H_8_N13", accessible: true},
        {nodeAId: "H_8_N13", nodeBId: "H_8_N19", accessible: true},
        {nodeAId: "H_8_N19", nodeBId: "H_8_N1", accessible: true},
        {nodeAId: "H_8_N1", nodeBId: "H_8_N15", accessible: true},
        {nodeAId: "H_8_N15", nodeBId: "H_8_N16", accessible: true},
        {nodeAId: "H_8_N16", nodeBId: "H_8_N6", accessible: true},
        {nodeAId: "H_8_N6", nodeBId: "H_8_N18", accessible: true},
        {nodeAId: "H_8_N18", nodeBId: "H_8_N5", accessible: true},
        {nodeAId: "H_8_N1", nodeBId: "H_8_N14", accessible: true},
        {nodeAId: "H_8_N17", nodeBId: "H_8_N20", accessible: true},


        {nodeAId: "H_8_N4", nodeBId: "H_8_N12", accessible: true},
        {nodeAId: "H_8_N12", nodeBId: "H_8_N11", accessible: true},
        {nodeAId: "H_8_N11", nodeBId: "H_8_N10", accessible: true},
        {nodeAId: "H_8_N10", nodeBId: "H_8_N9", accessible: true},
        {nodeAId: "H_8_N9", nodeBId: "H_8_N8", accessible: true},
        {nodeAId: "H_8_N8", nodeBId: "H_8_N7", accessible: true},
        {nodeAId: "H_8_N7", nodeBId: "H_8_N21", accessible: true},
        {nodeAId: "H_8_N21", nodeBId: "H_8_N6", accessible: true},

        //hall to class 
        { nodeAId: "H_8_N3", nodeBId: "H_801", accessible: true },
        {nodeAId: "H_8_N3", nodeBId: "H_867", accessible: true},
        {nodeAId: "H_8_N3", nodeBId: "H_865", accessible: true},
        {nodeAId: "H_8_N3", nodeBId: "H_863", accessible: true},

        {nodeAId: "H_8_N2", nodeBId: "H_861", accessible: true},
        {nodeAId: "H_8_N2", nodeBId: "H_859", accessible: true},
        {nodeAId: "H_8_N13", nodeBId: "H_857", accessible: true},
        {nodeAId: "H_8_N13", nodeBId: "H_855", accessible: true},
        {nodeAId: "H_8_N13", nodeBId: "H_854", accessible: true},


        {nodeAId: "H_8_N19", nodeBId: "H_853", accessible: true},
        {nodeAId: "H_8_N19", nodeBId: "H_852", accessible: true},

        {nodeAId: "H_8_N14", nodeBId: "H_851.03", accessible: true},
        {nodeAId: "H_8_N14", nodeBId: "H_851.02", accessible: true},
        {nodeAId: "H_8_N14", nodeBId: "H_851.01", accessible: true},
        {nodeAId: "H_8_N14", nodeBId: "H_849", accessible: true},

        {nodeAId: "H_8_N1", nodeBId: "H_847", accessible: true},
        {nodeAId: "H_8_N15", nodeBId: "H_845", accessible: true},

        {nodeAId: "H_8_N16", nodeBId: "H_843", accessible: true},
        {nodeAId: "H_8_N16", nodeBId: "H_841", accessible: true},
        {nodeAId: "H_8_N16", nodeBId: "H_842", accessible: true},

        {nodeAId: "H_8_N7", nodeBId: "H_837", accessible: true},
        {nodeAId: "H_8_N7", nodeBId: "H_835", accessible: true},

        {nodeAId: "H_8_N8", nodeBId: "H_833", accessible: true},
        {nodeAId: "H_8_N8", nodeBId: "H_831", accessible: true},
        {nodeAId: "H_8_N8", nodeBId: "H_829", accessible: true},

        {nodeAId: "H_8_N9", nodeBId: "H_822", accessible: true},
        {nodeAId: "H_8_N9", nodeBId: "H_827", accessible: true},
        {nodeAId: "H_8_N9", nodeBId: "H_825", accessible: true},
        {nodeAId: "H_8_N9", nodeBId: "H_820", accessible: true},

        {nodeAId: "H_8_N10", nodeBId: "H_820", accessible: true},
        {nodeAId: "H_8_N10", nodeBId: "H_823", accessible: true},
        {nodeAId: "H_8_N10", nodeBId: "H_821", accessible: true},

        {nodeAId: "H_8_N11", nodeBId: "H_819", accessible: true},
        {nodeAId: "H_8_N11", nodeBId: "H_817", accessible: true},
        {nodeAId: "H_8_N11", nodeBId: "H_815", accessible: true},

        {nodeAId: "H_8_N12", nodeBId: "H_813", accessible: true},
        {nodeAId: "H_8_N12", nodeBId: "H_811", accessible: true},
        {nodeAId: "H_8_N4", nodeBId: "H_807", accessible: true},

        {nodeAId: "H_8_N17", nodeBId: "H_803", accessible: true},
        {nodeAId: "H_8_N20", nodeBId: "H_805.03", accessible: true},
        {nodeAId: "H_8_N20", nodeBId: "H_805.02", accessible: true},
        {nodeAId: "H_8_N20", nodeBId: "H_805.01", accessible: true},

        {nodeAId: "H_8_N21", nodeBId: "H_832.06", accessible: true},

        {nodeAId: "H_start", nodeBId: "H_862", accessible: true},
        



        //hall to POI
        {nodeAId: "H_8_N17", nodeBId: "H_8_BATHROOM_1", accessible: true},
        {nodeAId: "H_8_N12", nodeBId: "H_8_BATHROOM_2", accessible: true},

        //hall to interfloor connection 
        {nodeAId: "H_start", nodeBId: "H_8_ELEVATOR", accessible: true },
        {nodeAId: "H_start", nodeBId: "H_8_STAIRS_1", accessible: false },
        {nodeAId: "H_8_N5", nodeBId: "H_8_ESCALATOR_UP", accessible: false},
        {nodeAId: "H_8_N18", nodeBId: "H_8_ESCALATOR_DOWN", accessible: false},
        {nodeAId: "H_8_N15", nodeBId: "H_8_STAIRS_2", accessible: false},
        {nodeAId: "H_8_N7", nodeBId: "H_8_STAIRS_3", accessible: false},
        {nodeAId: "H_8_N12", nodeBId: "H_8_STAIRS_4", accessible: true},
      ]
    },
    {
      floorId: "H_9",
      nodes: [
        //halways 
        {id: "H_9_N1", floorId: "H_9", x: 307, y: 399, type: "hallway"},

        //rooms 
        {id: "H_964", floorId: "H_9", x: 290, y: 433, type: "room"},

        //POI


        //interfloor connections (stais, escalators, elevator)
        {id: "H_9_STAIRS", floorId: "H_9", x: 307, y: 365, type: "stairs", label: "Stairwell"},
        {id: "H_9_ELEVATOR", floorId: "H_9", x: 358, y: 356, type: "elevator", label: "Elevator"}

      ],
      edges: [
        //hall to hall

        //hall to class 
        {nodeAId: "H_9_N1", nodeBId: "H_964", accessible: true},

        //hall to POI

        //hall to interfloor connection 
        {nodeAId: "H_9_ELEVATOR", nodeBId: "H_9_N1" , accessible: true},
        {nodeAId: "H_9_STAIRS", nodeBId: "H_9_N1" , accessible: false}
      ]
    }

  ],
  interFloorEdges: [
    // edges that connect floors
    { nodeAId: "H_8_ELEVATOR", nodeBId: "H_9_ELEVATOR", accessible: true},
    {nodeAId: "H_8_STAIRS_1", nodeBId: "H_9_STAIRS", accessible: false}
  ]
};