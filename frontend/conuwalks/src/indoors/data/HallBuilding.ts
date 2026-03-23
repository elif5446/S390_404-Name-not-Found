import { BuildingNavConfig } from '../types/Navigation';

export const hallBuildingNavConfig: BuildingNavConfig = {
  buildingId: "H", //needs to match the id of the BuildingIndoorConfig
  defaultStartNodeId: "",
  floors: [
    {
      floorId: "H_8",
      nodes: [

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
        {id: "H_8_N22", floorId: "H_8", x: 306, y: 394, type: "hallway"},

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
        {id: "H_835", floorId: "H_8", x: 740, y: 902, type: "room", label: "Room 835"},
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
        {id: "H_8_BATHROOM_1_N", floorId: "H_8", x: 376, y: 289, type: "bathroom", label: "Neutral Washroom"},
        {id: "H_8_BATHROOM_2_N", floorId: "H_8", x: 638, y: 289, type: "bathroom", label: "Neutral Washroom"},

        //interfloor connections (stais, escalators, elevator)
        {id:"H_8_ELEVATOR", floorId: "H_8", x: 340, y: 352, type: "elevator", label: "Elevator"},

        {id: "H_8_STAIRS_1", floorId: "H_8", x: 306, y: 359, type: "stairs", label: "Stairwell"},
        {id: "H_8_STAIRS_2", floorId: "H_8", x: 297, y: 727, type: "stairs", label: "Stairwell"},
        {id: "H_8_STAIRS_3", floorId: "H_8", x: 714, y: 727, type: "stairs", label: "Stairwell"},
        {id: "H_8_STAIRS_4", floorId: "H_8", x: 714, y: 289, type: "stairs", label: "Stairwell"},

        {id: "H_8_ESCALATOR_UP_TO_FLOOR_9", floorId: "H_8", x: 488, y: 431, type: "escalator", label: "Escalator Up to Floor 9"},
        {id: "H_8_ESCALATOR_DOWN_TO_FLOOR_2", floorId: "H_8", x: 488, y: 617, type: "escalator", label: "Escalator Down to Floor 2"}, 
      ],
      edges: [

        //hall to hall
        {nodeAId: "H_8_N3", nodeBId: "H_8_N2", accessible: true},
        {nodeAId: "H_8_N3", nodeBId: "H_8_N17", accessible: true},
        {nodeAId: "H_8_N17", nodeBId: "H_8_N4", accessible: true},
        {nodeAId: "H_8_N2", nodeBId: "H_8_N22", accessible: true},
        {nodeAId: "H_8_N22", nodeBId: "H_8_N5", accessible: true},
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

        {nodeAId: "H_8_N22", nodeBId: "H_862", accessible: true},
      
        //hall to POI
        {nodeAId: "H_8_N17", nodeBId: "H_8_BATHROOM_1_N", accessible: true},
        {nodeAId: "H_8_N12", nodeBId: "H_8_BATHROOM_2_N", accessible: true},

        //hall to interfloor connection 
        {nodeAId: "H_8_N22", nodeBId: "H_8_ELEVATOR", accessible: true },
        {nodeAId: "H_8_N22", nodeBId: "H_8_STAIRS_1", accessible: false },
        {nodeAId: "H_8_N5", nodeBId: "H_8_ESCALATOR_UP_TO_FLOOR_9", accessible: false},
        {nodeAId: "H_8_N18", nodeBId: "H_8_ESCALATOR_DOWN_TO_FLOOR_2", accessible: false},
        {nodeAId: "H_8_N15", nodeBId: "H_8_STAIRS_2", accessible: false},
        {nodeAId: "H_8_N7", nodeBId: "H_8_STAIRS_3", accessible: false},
        {nodeAId: "H_8_N12", nodeBId: "H_8_STAIRS_4", accessible: false},
      ]
    },
    {
      floorId: "H_9",
      nodes: [
        //halways 
        {id: "H_9_N1", floorId: "H_9", x: 307, y: 399, type: "hallway"},
        {id: "H_9_N2", floorId: "H_9", x: 850, y: 219, type: "hallway"},
        {id: "H_9_N3", floorId: "H_9", x: 670, y: 219, type: "hallway"},
        {id: "H_9_N4", floorId: "H_9", x: 853, y: 291, type: "hallway"},
        {id: "H_9_N5", floorId: "H_9", x: 853, y: 391, type: "hallway"},
        {id: "H_9_N6", floorId: "H_9", x: 855, y: 497, type: "hallway"},
        {id: "H_9_N7", floorId: "H_9", x: 819, y: 523, type: "hallway"},
        {id: "H_9_N8", floorId: "H_9", x: 819, y: 659, type: "hallway"},
        {id: "H_9_N9", floorId: "H_9", x: 618, y: 660, type: "hallway"},
        {id: "H_9_N10", floorId: "H_9", x: 660, y: 725, type: "hallway"},
        {id: "H_9_N11", floorId: "H_9", x: 708, y: 839, type: "hallway"},
        {id: "H_9_N12", floorId: "H_9", x: 819, y: 839, type: "hallway"},
        {id: "H_9_N13", floorId: "H_9", x: 397, y: 662, type: "hallway"},
        {id: "H_9_N14", floorId: "H_9", x: 399, y: 798, type: "hallway"},
        {id: "H_9_N15", floorId: "H_9", x: 389, y: 891, type: "hallway"},
        {id: "H_9_N16", floorId: "H_9", x: 324, y: 900, type: "hallway"},
        {id: "H_9_N17", floorId: "H_9", x: 234, y: 900, type: "hallway"},
        {id: "H_9_N18", floorId: "H_9", x: 147, y: 900, type: "hallway"},
        {id: "H_9_N19", floorId: "H_9", x: 79, y: 900, type: "hallway"},
        {id: "H_9_N20", floorId: "H_9", x: 79, y: 803, type: "hallway"},
        {id: "H_9_N21", floorId: "H_9", x: 79, y: 711, type: "hallway"},
        {id: "H_9_N22", floorId: "H_9", x: 79, y: 619, type: "hallway"},
        {id: "H_9_N23", floorId: "H_9", x: 79, y: 537, type: "hallway"},
        {id: "H_9_N24", floorId: "H_9", x: 300, y: 660, type: "hallway"},
        {id: "H_9_N25", floorId: "H_9", x: 524, y: 402, type: "hallway"},
        {id: "H_9_N26", floorId: "H_9", x: 179, y: 400, type: "hallway"},
        {id: "H_9_N27", floorId: "H_9", x: 179, y: 330, type: "hallway"},
        {id: "H_9_N28", floorId: "H_9", x: 179, y: 218, type: "hallway"},
        {id: "H_9_N29", floorId: "H_9", x: 327, y: 218, type: "hallway"},
        {id: "H_9_N30", floorId: "H_9", x: 524, y: 218, type: "hallway"},
        {id: "H_9_N31", floorId: "H_9", x: 79, y: 660, type: "hallway"},
        {id: "H_9_N32", floorId: "H_9", x: 525, y: 659, type: "hallway"},
        {id: "H_9_N33", floorId: "H_9", x: 942, y: 646, type: "hallway"},

        //rooms 
          //Left side 
          {id: "H_967", floorId: "H_9", x: 73, y: 166, type: "room", label: "Room 967"},
          {id: "H_965", floorId: "H_9", x: 74, y: 328, type: "room", label: "Room 965"},
          {id: "H_963", floorId: "H_9", x: 74, y: 440, type: "room", label: "Room 963"},
          {id: "H_961.01", floorId: "H_9", x: 32, y: 510, type: "room", label: "Room 961.01"},
          {id: "H_961.02", floorId: "H_9", x: 115, y: 512, type: "room", label: "Room 961.02"},
          {id: "H_961.03", floorId: "H_9", x: 32, y: 581, type: "room", label: "Room 961.03"},
          {id: "H_961.04", floorId: "H_9", x: 115, y: 554, type: "room", label: "Room 961.04"},
          {id: "H_961.06", floorId: "H_9", x: 115, y: 598, type: "room", label: "Room 961.06"},
          {id: "H_961.07", floorId: "H_9", x: 32, y: 644, type: "room", label: "Room 961.07"},
          {id: "H_961.09", floorId: "H_9", x: 32, y: 695, type: "room", label: "Room 961.09"},
          {id: "H_961.11", floorId: "H_9", x: 32, y: 738, type: "room", label: "Room 961.11"},
          {id: "H_961.13", floorId: "H_9", x: 32, y: 785, type: "room", label: "Room 961.13"},
          {id: "H_961.15", floorId: "H_9", x: 32, y: 828, type: "room", label: "Room 961.15"},
          {id: "H_961.17", floorId: "H_9", x: 32, y: 869, type: "room", label: "Room 961.17"},
          {id: "H_961.19", floorId: "H_9", x: 32, y: 933, type: "room", label: "Room 961.19"},

          //Right side
          {id: "H_917", floorId: "H_9", x: 937, y: 118, type: "room", label: "Room 917"},
          {id: "H_919", floorId: "H_9", x: 937, y: 240, type: "room", label: "Room 919"},
          {id: "H_921", floorId: "H_9", x: 937, y: 327, type: "room", label: "Room 921"},
          {id: "H_923", floorId: "H_9", x: 939, y: 434, type: "room", label: "Room 923"},
          {id: "H_925.01", floorId: "H_9", x: 895, y: 536, type: "room", label: "Room 925.01"},
          {id: "H_925.02", floorId: "H_9", x: 966, y: 547, type: "room", label: "Room 925.02"},
          {id: "H_925.03", floorId: "H_9", x: 885, y: 580, type: "room", label: "Room 925.03"},
          {id: "H_927", floorId: "H_9", x: 934, y: 732, type: "room", label: "Room 927"},
          {id: "H_927.04", floorId: "H_9", x: 879, y: 641, type: "room", label: "Room 927.04"},
          {id: "H_927.01", floorId: "H_9", x: 978, y: 664, type: "room", label: "Room 927.01"},
          {id: "H_927.03", floorId: "H_9", x: 978, y: 619, type: "room", label: "Room 927.03"},
          {id: "H_931", floorId: "H_9", x: 848, y: 836, type: "room", label: "Room 931"},
          {id: "H_929", floorId: "H_9", x: 916, y: 883, type: "room", label: "Room 929"},

          //Bottom
          {id: "H_961.21", floorId: "H_9", x: 81, y: 940, type: "room", label: "Room 961.21"},
          {id: "H_961.23", floorId: "H_9", x: 122, y: 940, type: "room", label: "Room 961.23"},
          {id: "H_961.25", floorId: "H_9", x: 167, y: 940, type: "room", label: "Room 961.25"},
          {id: "H_961.27", floorId: "H_9", x: 212, y: 940, type: "room", label: "Room 961.27"},
          {id: "H_961.29", floorId: "H_9", x: 257, y: 940, type: "room", label: "Room 961.29"},
          {id: "H_961.31", floorId: "H_9", x: 301, y: 940, type: "room", label: "Room 961.31"},
          {id: "H_961.33", floorId: "H_9", x: 346, y: 940, type: "room", label: "Room 961.33"},
          {id: "H_941", floorId: "H_9", x: 423, y: 933, type: "room", label: "Room 941"},
          {id: "H_937", floorId: "H_9", x: 543, y: 798, type: "room", label: "Room 937"},
          {id: "H_933", floorId: "H_9", x: 753, y: 911, type: "room", label: "Room 933"},
          {id: "H_932", floorId: "H_9", x: 738, y: 805, type: "room", label: "Room 932"},
          {id: "H_928", floorId: "H_9", x: 789, y: 805, type: "room", label: "Room 928"},

          //top
          {id: "H_903", floorId: "H_9", x: 235, y: 112, type: "room", label: "Room 903"},
          {id: "H_907", floorId: "H_9", x: 409, y: 112, type: "room", label: "Room 907"},
          {id: "H_909", floorId: "H_9", x: 544, y: 112, type: "room", label: "Room 909"},
          {id: "H_911", floorId: "H_9", x: 632, y: 112, type: "room", label: "Room 911"},
          {id: "H_913", floorId: "H_9", x: 729, y: 112, type: "room", label: "Room 913"},
          {id: "H_915", floorId: "H_9", x: 821, y: 113, type: "room", label: "Room 915"},

          //middle
          {id: "H_964", floorId: "H_9", x: 282, y: 488, type: "room", label: "Room 964"},
          {id: "H_968", floorId: "H_9", x: 227, y: 604, type: "room", label: "Room 968"},
          {id: "H_966", floorId: "H_9", x: 359, y: 604, type: "room", label: "Room 966"},
          {id: "H_962", floorId: "H_9", x: 369, y: 489, type: "room", label: "Room 962"},

          {id: "H_961.14", floorId: "H_9", x: 140, y: 780, type: "room", label: "Room 961.14"},
          {id: "H_961.26", floorId: "H_9", x: 143, y: 857, type: "room", label: "Room 961.26"},
          {id: "H_961.28", floorId: "H_9", x: 218, y: 854, type: "room", label: "Room 961.28"},
          {id: "H_961.30", floorId: "H_9", x: 259, y: 853, type: "room", label: "Room 961.30"},
          {id: "H_943", floorId: "H_9", x: 330, y: 853, type: "room", label: "Room 943"},
          {id: "H_945", floorId: "H_9", x: 290, y: 798, type: "room", label: "Room 945"},
          {id: "H_920", floorId: "H_9", x: 658, y: 469, type: "room", label: "Room 920"},

        //POI
          //bathroom
          {id: "H_9_BATHROOM_1_W", floorId: "H_9", x: 355, y: 282, type: "bathroom", label: "Womens Washroom"},
          {id: "H_9_BATHROOM_2_M", floorId: "H_9", x: 629, y: 293, type: "bathroom", label: "Mens Washroom"},
          

        //interfloor connections (stais, escalators, elevator)
        {id: "H_9_STAIRS_1", floorId: "H_9", x: 307, y: 365, type: "stairs", label: "Stairwell"},
        {id: "H_9_STAIRS_2", floorId: "H_9", x: 709, y: 727, type: "stairs", label: "Stairwell"},
        {id: "H_9_STAIRS_3", floorId: "H_9", x: 295, y: 724, type: "stairs", label: "Stairwell"},
        {id: "H_9_STAIRS_4", floorId: "H_9", x: 714, y: 291, type: "stairs", label: "Stairwell"},

        {id: "H_9_ELEVATOR", floorId: "H_9", x: 358, y: 356, type: "elevator", label: "Elevator"},

        {id: "H_9_ESCALATOR_DOWN_TO_FLOOR_8", floorId: "H_9", x: 480, y: 444, type: "escalator", label: "Escalator Down to Floor 8"},
        {id: "H_9_ESCALATOR_UP_TO_FLOOR_10", floorId: "H_9", x: 515, y: 444, type: "escalator", label: "Escalator Up to Floor 10"}, 
        {id: "H_9_ESCALATOR_UP_TO_FLOOR_9", floorId: "H_9", x: 480, y: 627, type: "escalator", label: "Escalator Up to Floor 9"}, 
      ],
      edges: [
        //hall to hall
        {nodeAId: "H_9_N1", nodeBId: "H_9_N25", accessible: true},
        {nodeAId: "H_9_N1", nodeBId: "H_9_N26", accessible: true},
        {nodeAId: "H_9_N26", nodeBId: "H_9_N27", accessible: true},
        {nodeAId: "H_9_N27", nodeBId: "H_9_N28", accessible: true},
        {nodeAId: "H_9_N28", nodeBId: "H_9_N29", accessible: true},
        {nodeAId: "H_9_N29", nodeBId: "H_9_N30", accessible: true},
        {nodeAId: "H_9_N30", nodeBId: "H_9_N25", accessible: true},

        {nodeAId: "H_9_N30", nodeBId: "H_9_N3", accessible: true},
        {nodeAId: "H_9_N3", nodeBId: "H_9_N2", accessible: true},
        {nodeAId: "H_9_N2", nodeBId: "H_9_N4", accessible: true},
        {nodeAId: "H_9_N4", nodeBId: "H_9_N5", accessible: true},
        {nodeAId: "H_9_N5", nodeBId: "H_9_N6", accessible: true},
        {nodeAId: "H_9_N6", nodeBId: "H_9_N7", accessible: true},
        {nodeAId: "H_9_N7", nodeBId: "H_9_N8", accessible: true},
        {nodeAId: "H_9_N8", nodeBId: "H_9_N9", accessible: true},
        {nodeAId: "H_9_N9", nodeBId: "H_9_N32", accessible: true},

        {nodeAId: "H_9_N8", nodeBId: "H_9_N12", accessible: true},
        {nodeAId: "H_9_N12", nodeBId: "H_9_N11", accessible: true},
        {nodeAId: "H_9_N11", nodeBId: "H_9_N10", accessible: true},
        {nodeAId: "H_9_N10", nodeBId: "H_9_N9", accessible: true},

        {nodeAId: "H_9_N32", nodeBId: "H_9_N25", accessible: true},
        {nodeAId: "H_9_N32", nodeBId: "H_9_N13", accessible: true},
        {nodeAId: "H_9_N13", nodeBId: "H_9_N14", accessible: true},
        {nodeAId: "H_9_N14", nodeBId: "H_9_N15", accessible: true},
        {nodeAId: "H_9_N15", nodeBId: "H_9_N16", accessible: true},
        {nodeAId: "H_9_N16", nodeBId: "H_9_N17", accessible: true},
        {nodeAId: "H_9_N17", nodeBId: "H_9_N18", accessible: true},
        {nodeAId: "H_9_N18", nodeBId: "H_9_N19", accessible: true},
        {nodeAId: "H_9_N19", nodeBId: "H_9_N20", accessible: true},
        {nodeAId: "H_9_N20", nodeBId: "H_9_N21", accessible: true},
        {nodeAId: "H_9_N21", nodeBId: "H_9_N31", accessible: true},
        {nodeAId: "H_9_N31", nodeBId: "H_9_N22", accessible: true},
        {nodeAId: "H_9_N22", nodeBId: "H_9_N23", accessible: true},
        {nodeAId: "H_9_N31", nodeBId: "H_9_N24", accessible: true},
        {nodeAId: "H_9_N24", nodeBId: "H_9_N13", accessible: true},

        //hall to class 
        {nodeAId: "H_9_N1", nodeBId: "H_964", accessible: true},
        {nodeAId: "H_9_N1", nodeBId: "H_962", accessible: true},

        {nodeAId: "H_9_N2", nodeBId: "H_915", accessible: true},
        {nodeAId: "H_9_N2", nodeBId: "H_917", accessible: true},

        {nodeAId: "H_9_N3", nodeBId: "H_911", accessible: true},
        {nodeAId: "H_9_N3", nodeBId: "H_913", accessible: true},

        {nodeAId: "H_9_N4", nodeBId: "H_919", accessible: true},
        {nodeAId: "H_9_N4", nodeBId: "H_921", accessible: true},

        {nodeAId: "H_9_N5", nodeBId: "H_923", accessible: true},
        {nodeAId: "H_9_N5", nodeBId: "H_920", accessible: true},

        {nodeAId: "H_9_N6", nodeBId: "H_925.01", accessible: true},
        {nodeAId: "H_9_N6", nodeBId: "H_925.02", accessible: true},
        {nodeAId: "H_9_N6", nodeBId: "H_925.03", accessible: true},

        {nodeAId: "H_9_N8", nodeBId: "H_927", accessible: true},
        {nodeAId: "H_9_N8", nodeBId: "H_927.04", accessible: true},

        {nodeAId: "H_9_N10", nodeBId: "H_937", accessible: true},

        {nodeAId: "H_9_N11", nodeBId: "H_932", accessible: true},
        {nodeAId: "H_9_N11", nodeBId: "H_933", accessible: true},

        {nodeAId: "H_9_N12", nodeBId: "H_928", accessible: true},
        {nodeAId: "H_9_N12", nodeBId: "H_931", accessible: true},
        {nodeAId: "H_9_N12", nodeBId: "H_929", accessible: true},

        {nodeAId: "H_9_N13", nodeBId: "H_937", accessible: true},
        {nodeAId: "H_9_N14", nodeBId: "H_945", accessible: true},
        {nodeAId: "H_9_N15", nodeBId: "H_941", accessible: true},

        {nodeAId: "H_9_N16", nodeBId: "H_943", accessible: true},
        {nodeAId: "H_9_N16", nodeBId: "H_961.33", accessible: true},
        {nodeAId: "H_9_N16", nodeBId: "H_961.31", accessible: true},

        {nodeAId: "H_9_N17", nodeBId: "H_961.30", accessible: true},
        {nodeAId: "H_9_N17", nodeBId: "H_961.28", accessible: true},
        {nodeAId: "H_9_N17", nodeBId: "H_961.27", accessible: true},
        {nodeAId: "H_9_N17", nodeBId: "H_961.29", accessible: true},

        {nodeAId: "H_9_N18", nodeBId: "H_961.26", accessible: true},
        {nodeAId: "H_9_N18", nodeBId: "H_961.23", accessible: true},
        {nodeAId: "H_9_N18", nodeBId: "H_961.25", accessible: true},

        {nodeAId: "H_9_N19", nodeBId: "H_961.21", accessible: true},
        {nodeAId: "H_9_N19", nodeBId: "H_961.19", accessible: true},
        {nodeAId: "H_9_N19", nodeBId: "H_961.17", accessible: true},

        {nodeAId: "H_9_N20", nodeBId: "H_961.13", accessible: true},
        {nodeAId: "H_9_N20", nodeBId: "H_961.15", accessible: true},
        {nodeAId: "H_9_N20", nodeBId: "H_961.14", accessible: true},

        {nodeAId: "H_9_N21", nodeBId: "H_961.09", accessible: true},
        {nodeAId: "H_9_N21", nodeBId: "H_961.11", accessible: true},

        {nodeAId: "H_9_N22", nodeBId: "H_961.07", accessible: true},
        {nodeAId: "H_9_N22", nodeBId: "H_961.03", accessible: true},
        {nodeAId: "H_9_N22", nodeBId: "H_961.06", accessible: true},

        {nodeAId: "H_9_N23", nodeBId: "H_961.01", accessible: true},
        {nodeAId: "H_9_N23", nodeBId: "H_961.02", accessible: true},
        {nodeAId: "H_9_N23", nodeBId: "H_961.04", accessible: true},

        {nodeAId: "H_9_N24", nodeBId: "H_968", accessible: true},
        {nodeAId: "H_9_N24", nodeBId: "H_966", accessible: true},

        {nodeAId: "H_9_N26", nodeBId: "H_963", accessible: true},
        {nodeAId: "H_9_N27", nodeBId: "H_965", accessible: true},
        {nodeAId: "H_9_N28", nodeBId: "H_967", accessible: true},

        {nodeAId: "H_9_N29", nodeBId: "H_903", accessible: true},
        {nodeAId: "H_9_N29", nodeBId: "H_907", accessible: true},
        {nodeAId: "H_9_N30", nodeBId: "H_909", accessible: true},

        {nodeAId: "H_9_N33", nodeBId: "H_927.04", accessible: true},
        {nodeAId: "H_9_N33", nodeBId: "H_927.01", accessible: true},
        {nodeAId: "H_9_N33", nodeBId: "H_927.03", accessible: true},
        {nodeAId: "H_9_N33", nodeBId: "H_927", accessible: true},

        //hall to POI
        {nodeAId: "H_9_N29", nodeBId: "H_9_BATHROOM_1_W", accessible: true},
        {nodeAId: "H_9_N3", nodeBId: "H_9_BATHROOM_2_M", accessible: true},


        //hall to interfloor connection 
        {nodeAId: "H_9_ELEVATOR", nodeBId: "H_9_N1" , accessible: true},

        {nodeAId: "H_9_STAIRS_1", nodeBId: "H_9_N1" , accessible: false},
        {nodeAId: "H_9_STAIRS_2", nodeBId: "H_9_N9" , accessible: false},
        {nodeAId: "H_9_STAIRS_3", nodeBId: "H_9_N24" , accessible: false},
        {nodeAId: "H_9_STAIRS_4", nodeBId: "H_9_N3" , accessible: false},

        {nodeAId: "H_9_ESCALATOR_DOWN_TO_FLOOR_8", nodeBId: "H_9_N25" , accessible: false},
        {nodeAId: "H_9_ESCALATOR_UP_TO_FLOOR_10", nodeBId: "H_9_N25" , accessible: false},
        {nodeAId: "H_9_ESCALATOR_UP_TO_FLOOR_9", nodeBId: "H_9_N32" , accessible: false},
      ]
    },
    {
      floorId: "H_1",
      nodes :[

        //entrances
        {id: "H_1_ENTRANCE_1", floorId: "H_1", x: 357, y: 710, type: "entrance", label: "Entrance"},
        {id: "H_1_ENTRANCE_2", floorId: "H_1", x: 239, y: 707, type: "entrance", label: "Entrance"},
        {id: "H_1_ENTRANCE_3", floorId: "H_1", x: 983, y: 650, type: "entrance", label: "Entrance"},
        {id: "H_1_ENTRANCE_4", floorId: "H_1", x: 983, y: 695, type: "entrance", label: "Entrance"},


        //POI
        {id: "H_1_BATHROOM_1_N", floorId: "H_1", x: 456, y: 285, type: "bathroom", label: "Neutral Washroom"},
        {id: "H_1_SECURITY", floorId: "H_1", x: 859, y: 414, type: "helpDesk", label: "Security desk"},

        //hallways
        {id: "H_1_N1", floorId: "H_1", x: 372, y: 633, type: "hallway"},
        {id: "H_1_N2", floorId: "H_1", x: 232, y: 633, type: "hallway"},
        {id: "H_1_N3", floorId: "H_1", x: 290, y: 532, type: "hallway"},
        {id: "H_1_N4", floorId: "H_1", x: 535, y: 465, type: "hallway"},
        {id: "H_1_N5", floorId: "H_1", x: 699, y: 465, type: "hallway"},
        {id: "H_1_N6", floorId: "H_1", x: 858, y: 465, type: "hallway"},
        {id: "H_1_N7", floorId: "H_1", x: 860, y: 651, type: "hallway"},
        {id: "H_1_N8", floorId: "H_1", x: 600, y: 653, type: "hallway"},
        {id: "H_1_N9", floorId: "H_1", x: 535, y: 207, type: "hallway"},
        {id: "H_1_N10", floorId: "H_1", x: 955, y: 661, type: "hallway"},
        {id: "H_1_N11", floorId: "H_1", x: 955, y: 473, type: "hallway"},

        //room
        {id: "H_110", floorId: "H_1", x: 260, y: 344, type: "room", label: "Room 110"},

        //Interfloor connection
        {id: "H_1_ESCALATOR_UP_TO_FLOOR_1", floorId: "H_1", x: 775, y: 725, type: "escalator", label: "Escalator Up to Floor 1"},
        {id: "H_1_ESCALATOR_DOWN_TO_FLOOR_1", floorId: "H_1", x: 640, y: 620, type: "escalator", label: "Escalator Down to Floor 1"},
        {id: "H_1_ESCALATOR_UP_TO_FLOOR_2", floorId: "H_1", x: 827, y: 618, type: "escalator", label: "Escalator Up to Floor 2"},

        {id: "H_1_STAIRS_1", floorId: "H_1", x: 775, y: 705, type: "stairs", label: "Stairs"},
        {id: "H_1_STAIRS_2", floorId: "H_1", x: 590, y: 620, type: "stairs", label: "Stairs"},
        {id: "H_1_STAIRS_3", floorId: "H_1", x: 876, y: 618, type: "stairs", label: "Stairs"},

        {id: "H_1_ELEVATOR_1", floorId: "H_1", x: 708, y: 561, type: "elevator", label: "Elevator"},
        {id: "H_1_ELEVATOR_2", floorId: "H_1", x: 759, y: 562, type: "elevator", label: "Elevaror"},
      ],
      edges: [

        //hall to hall
        {nodeAId:"H_1_N1", nodeBId: "H_1_N2", accessible: true},
        {nodeAId:"H_1_N1", nodeBId: "H_1_N3", accessible: true},
        {nodeAId:"H_1_N1", nodeBId: "H_1_N8", accessible: true},
        {nodeAId:"H_1_N1", nodeBId: "H_1_N4", accessible: true},

        {nodeAId:"H_1_N2", nodeBId: "H_1_N3", accessible: true},
        {nodeAId:"H_1_N4", nodeBId: "H_1_N9", accessible: true},
        {nodeAId:"H_1_N4", nodeBId: "H_1_N5", accessible: true},
        {nodeAId:"H_1_N5", nodeBId: "H_1_N6", accessible: true},
        {nodeAId:"H_1_N6", nodeBId: "H_1_N11", accessible: true},
        {nodeAId:"H_1_N7", nodeBId: "H_1_N8", accessible: true},
        {nodeAId:"H_1_N7", nodeBId: "H_1_N10", accessible: true},
        {nodeAId:"H_1_N10", nodeBId: "H_1_N11", accessible: true},

        //hall to PIO
        {nodeAId:"H_1_N6", nodeBId: "H_1_SECURITY", accessible: true},
        {nodeAId:"H_1_N4", nodeBId: "H_1_BATHROOM_1_N", accessible: true},
        
        //hall to class
        {nodeAId:"H_1_N3", nodeBId: "H_110", accessible: true},

        //hall to entrance 
        {nodeAId:"H_1_N1", nodeBId: "H_1_ENTRANCE_1", accessible: true},
        {nodeAId:"H_1_N2", nodeBId: "H_1_ENTRANCE_2", accessible: true},

        {nodeAId:"H_1_N10", nodeBId: "H_1_ENTRANCE_3", accessible: true},
        {nodeAId:"H_1_N10", nodeBId: "H_1_ENTRANCE_4", accessible: true},


        //hall to interfloor connections
        {nodeAId:"H_1_STAIRS_1", nodeBId: "H_1_N7", accessible: false},
        {nodeAId:"H_1_STAIRS_2", nodeBId: "H_1_N8", accessible: false},
        {nodeAId:"H_1_STAIRS_3", nodeBId: "H_1_N7", accessible: false},

        {nodeAId:"H_1_ESCALATOR_UP_TO_FLOOR_1", nodeBId: "H_1_N7", accessible: false},
        {nodeAId:"H_1_ESCALATOR_DOWN_TO_FLOOR_1", nodeBId: "H_1_N8", accessible: false},
        {nodeAId:"H_1_ESCALATOR_UP_TO_FLOOR_2", nodeBId: "H_1_N7", accessible: false},

        {nodeAId:"H_1_ELEVATOR_1", nodeBId: "H_1_N5", accessible: true},
        {nodeAId:"H_1_ELEVATOR_2", nodeBId: "H_1_N5", accessible: true},
      ]
    },
    {
      floorId: "H_2",
      nodes: [
        //hallway
        {id: "H_2_N1", floorId: "H_2", x: 570, y: 741, type: "hallway"},
        {id: "H_2_N2", floorId: "H_2", x: 685, y: 741, type: "hallway"},
        {id: "H_2_N3", floorId: "H_2", x: 788, y: 741, type: "hallway"},
        {id: "H_2_N4", floorId: "H_2", x: 722, y: 407, type: "hallway"},
        {id: "H_2_N5", floorId: "H_2", x: 971, y: 407, type: "hallway"},
        {id: "H_2_N6", floorId: "H_2", x: 471, y: 407, type: "hallway"},
        
        //POI
        {id: "H_2_HIVE_CAFE", floorId: "H_2", x: 471, y: 256, type: "food", label: "Hive Cafe"},
        {id: "H_2_STUDENT_UNION", floorId: "H_2", x: 801, y: 326, type: "helpDesk", label: "Student Union"},

        //stairs
        {id: "H_2_STAIRS_1", floorId: "H_2", x: 554, y: 811, type: "stairs", label: "Stairs"},
        {id: "H_2_STAIRS_2", floorId: "H_2", x: 815, y: 811, type: "stairs", label: "Stairs"},

        //escalator 
        {id: "H_2_ESCALATOR_DOWN_TO_FLOOR_1", floorId: "H_2", x: 608, y: 811, type: "escalator", label: "Escalator Down to Floor 1"},
        {id: "H_2_ESCALATOR_UP_TO_FLOOR_2", floorId: "H_2", x: 759, y: 811, type: "escalator", label: "Escalator on Floor 2"},
        {id: "H_2_ESCALATOR_UP_TO_FLOOR_8", floorId: "H_2", x: 574, y: 429, type: "escalator", label: "Escalator Up to Floor 8"},
        {id: "H_2_ESCALATOR_DOWN_TO_FLOOR_2", floorId: "H_2", x: 519, y: 681, type: "escalator", label: "Escalator Down to Floor 2"},

        //elevator
        {id: "H_2_ELEVATOR_1", floorId: "H_2", x: 660, y: 811, type: "elevator", label: "Elevator"},
        {id: "H_2_ELEVATOR_2", floorId: "H_2", x: 709, y: 811, type: "elevator", label: "Elevator"},
      ],
      edges: [
        //hall to POI
        {nodeAId: "H_2_N6", nodeBId: "H_2_HIVE_CAFE", accessible: true},
        {nodeAId: "H_2_N4", nodeBId: "H_2_STUDENT_UNION", accessible: true},

        //hall to hall
        {nodeAId: "H_2_N1", nodeBId: "H_2_N2", accessible: true},
        {nodeAId: "H_2_N2", nodeBId: "H_2_N3", accessible: true},
        {nodeAId: "H_2_N3", nodeBId: "H_2_N4", accessible: true},
        {nodeAId: "H_2_N4", nodeBId: "H_2_N6", accessible: true},
        {nodeAId: "H_2_N4", nodeBId: "H_2_N5", accessible: true},

        //hall to stairs
        {nodeAId: "H_2_N1", nodeBId: "H_2_STAIRS_1", accessible: false},
        {nodeAId: "H_2_N3", nodeBId: "H_2_STAIRS_2", accessible: false},

        //hall to escalator
        {nodeAId: "H_2_N1", nodeBId: "H_2_ESCALATOR_DOWN_TO_FLOOR_1", accessible: false},
        {nodeAId: "H_2_N3", nodeBId: "H_2_ESCALATOR_UP_TO_FLOOR_2", accessible: false},

        {nodeAId: "H_2_N4", nodeBId: "H_2_ESCALATOR_UP_TO_FLOOR_8", accessible: false},
        {nodeAId: "H_2_N6", nodeBId: "H_2_ESCALATOR_UP_TO_FLOOR_8", accessible: false},

        {nodeAId: "H_2_N1", nodeBId: "H_2_ESCALATOR_DOWN_TO_FLOOR_2", accessible: false},

        //hall to elevator
        {nodeAId: "H_2_N2", nodeBId: "H_2_ELEVATOR_1", accessible: true},
        {nodeAId: "H_2_N2", nodeBId: "H_2_ELEVATOR_2", accessible: true},
      ]
    }

  ],
  interFloorEdges: [
    // edges that connect floors for H8 and H9
    {nodeAId: "H_8_ELEVATOR", nodeBId: "H_9_ELEVATOR", accessible: true},

    {nodeAId: "H_8_STAIRS_1", nodeBId: "H_9_STAIRS_1", accessible: false},
    {nodeAId: "H_8_STAIRS_2", nodeBId: "H_9_STAIRS_3", accessible: false},
    {nodeAId: "H_8_STAIRS_3", nodeBId: "H_9_STAIRS_2", accessible: false},
    {nodeAId: "H_8_STAIRS_4", nodeBId: "H_9_STAIRS_4", accessible: false},
    
    {nodeAId: "H_9_ESCALATOR_DOWN_TO_FLOOR_8", nodeBId: "H_8_ESCALATOR_DOWN_TO_FLOOR_2", accessible: false},
    {nodeAId: "H_8_ESCALATOR_UP_TO_FLOOR_9", nodeBId: "H_9_ESCALATOR_UP_TO_FLOOR_9", accessible: false},

    // edges that connect floors for H2 and H8
    {nodeAId: "H_2_ESCALATOR_UP_TO_FLOOR_8", nodeBId: "H_8_ESCALATOR_UP_TO_FLOOR_9", accessible: false},
    {nodeAId: "H_8_ESCALATOR_DOWN_TO_FLOOR_2", nodeBId: "H_2_ESCALATOR_DOWN_TO_FLOOR_2", accessible: false},

    {nodeAId: "H_2_ELEVATOR_1", nodeBId: "H_8_ELEVATOR", accessible: true},
    {nodeAId: "H_2_ELEVATOR_2", nodeBId: "H_8_ELEVATOR", accessible: true},

    // edges that connect floors for H1 and H2
    {nodeAId: "H_1_STAIRS_2", nodeBId: "H_2_STAIRS_1", accessible: false},
    {nodeAId: "H_1_STAIRS_3", nodeBId: "H_2_STAIRS_2", accessible: false},

    {nodeAId: "H_1_ESCALATOR_UP_TO_FLOOR_2", nodeBId: "H_2_ESCALATOR_UP_TO_FLOOR_2", accessible: false},
    {nodeAId: "H_2_ESCALATOR_DOWN_TO_FLOOR_1", nodeBId: "H_1_ESCALATOR_DOWN_TO_FLOOR_1", accessible: false},

    {nodeAId: "H_1_ELEVATOR_1", nodeBId: "H_2_ELEVATOR_1", accessible: true},
    {nodeAId: "H_1_ELEVATOR_2", nodeBId: "H_2_ELEVATOR_2", accessible: true}

  ]
};
