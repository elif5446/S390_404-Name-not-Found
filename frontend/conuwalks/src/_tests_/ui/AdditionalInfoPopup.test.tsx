import React, { createRef } from "react";
import { Animated, Platform } from "react-native";
import { render, screen, act } from "@testing-library/react-native";
import AdditionalInfoPopup, {
  AdditionalInfoPopupHandle,
} from "../../components/AdditionalInfoPopup";

import { useBuildingData } from "../../hooks/useBuildingData";
import { useBottomSheet } from "../../hooks/useBottomSheet";
import { useBuildingEvents } from "../../hooks/useBuildingEvents";

jest.mock("../../hooks/useBuildingData");
jest.mock("../../hooks/useBottomSheet");
jest.mock("../../hooks/useBuildingEvents");

jest.mock("../../components/AdditionalInfoPopupHeader", () => {
  const { View } = require("react-native");
  const MockHeader = (props: any) => <View testID="mock-header" {...props} />;
  MockHeader.displayName = "MockAdditionalInfoPopupHeader";
  return MockHeader;
});

jest.mock("../../components/AdditionalInfoPopupContent", () => {
  const { View } = require("react-native");
  const MockContent = (props: any) => <View testID="mock-content" {...props} />;
  MockContent.displayName = "MockAdditionalInfoPopupContent";
  return MockContent;
});

jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: (props: any) => <View testID="mock-blur-view" {...props} />,
  };
});

describe("AdditionalInfoPopup Component", () => {
  const mockSnapTo = jest.fn();
  const mockMinimize = jest.fn();
 
  const mockDismiss = jest.fn((payload, onDone) => onDone?.());
  const mockOnClose = jest.fn();
  const mockOnDirectionsTrigger = jest.fn();

  const mockScrollOffsetRef = { current: 0 };

  const defaultProps = {
    visible: true,
    buildingId: "H",
    campus: "SGW" as const,
    onClose: mockOnClose,
    onDirectionsTrigger: mockOnDirectionsTrigger,
    directionsEtaLabel: "10 min",
  };

  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    
    (useBuildingData as jest.Mock).mockReturnValue({
      buildingInfo: { name: "Henry F. Hall" },
      isCopying: false,
      copyAddress: jest.fn(),
      accessibilityIcons: [
        {
          key: "wheelchair",
          sf: "figure.roll",
          material: "accessible",
          label: "Accessible",
        },
      ],
    });

    (useBuildingEvents as jest.Mock).mockReturnValue({
      todayEvents: [{ id: "1", courseName: "Test Course" }],
      nextEvent: null,
      loading: false,
    });

    (useBottomSheet as jest.Mock).mockReturnValue({
      translateY: new Animated.Value(0),
      MAX_HEIGHT: 800,
      SNAP_OFFSET: 400,
      scrollOffsetRef: mockScrollOffsetRef,
      snapTo: mockSnapTo,
      minimize: mockMinimize,
      dismiss: mockDismiss,
      handleToggleHeight: jest.fn(),
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.useRealTimers();
  });

  
  it("renders the blurred background wrapper on iOS", () => {
    Platform.OS = "ios";
    render(<AdditionalInfoPopup {...defaultProps} />);
    expect(screen.getByTestId("mock-blur-view")).toBeTruthy();
  });

  it("renders the standard elevation view on Android", () => {
    Platform.OS = "android";
    render(<AdditionalInfoPopup {...defaultProps} />);
    
    expect(screen.queryByTestId("mock-blur-view")).toBeNull();
  });

  it("still renders header and content on Android (non-blur path)", () => {
    Platform.OS = "android";
    render(<AdditionalInfoPopup {...defaultProps} />);
    expect(screen.getByTestId("mock-header")).toBeTruthy();
    expect(screen.getByTestId("mock-content")).toBeTruthy();
  });

 

  it("passes correct props to Header and Content children", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");
    const content = screen.getByTestId("mock-content");

    expect(header).toBeTruthy();
    expect(content).toBeTruthy();


    expect(header.props.buildingId).toBe("H");
    expect(header.props.directionsEtaLabel).toBe("10 min");
    expect(header.props.accessibilityIcons.length).toBe(1);

    expect(content.props.buildingInfo.name).toBe("Henry F. Hall");
    expect(content.props.directionsEtaLabel).toBe("10 min");
    expect(content.props.eventsLoading).toBe(false);
    expect(content.props.todayEvents.length).toBe(1);
    expect(content.props.nextEvent).toBeNull();
  });

  it("forwards isCopying and copyAddress to PopupContent", () => {
    const mockCopyAddress = jest.fn();
    (useBuildingData as jest.Mock).mockReturnValue({
      buildingInfo: { name: "Henry F. Hall" },
      isCopying: true,
      copyAddress: mockCopyAddress,
      accessibilityIcons: [],
    });

    render(<AdditionalInfoPopup {...defaultProps} />);

    const content = screen.getByTestId("mock-content");
    expect(content.props.isCopying).toBe(true);
    expect(content.props.onCopyAddress).toBe(mockCopyAddress);
  });

  it("forwards onOpenIndoorPress and showOpenIndoorButton to PopupHeader", () => {
    const mockOnOpenIndoorPress = jest.fn();
    render(
      <AdditionalInfoPopup
        {...defaultProps}
        onOpenIndoorPress={mockOnOpenIndoorPress}
        showOpenIndoorButton={true}
      />,
    );

    const header = screen.getByTestId("mock-header");
    expect(header.props.onOpenIndoorPress).toBe(mockOnOpenIndoorPress);
    expect(header.props.showOpenIndoorButton).toBe(true);
  });

  it("passes onExpansionChange through to useBottomSheet", () => {
    const mockOnExpansionChange = jest.fn();
    render(
      <AdditionalInfoPopup
        {...defaultProps}
        onExpansionChange={mockOnExpansionChange}
      />,
    );

    expect(useBottomSheet).toHaveBeenCalledWith(
      expect.objectContaining({ onExpansionChange: mockOnExpansionChange }),
    );
  });

  

  it("passes onClose (as onDismiss) and visible to useBottomSheet", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    expect(useBottomSheet).toHaveBeenCalledWith(
      expect.objectContaining({ onDismiss: mockOnClose, visible: true }),
    );
  });

  it("passes campus and buildingId to useBuildingData and useBuildingEvents", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    expect(useBuildingData).toHaveBeenCalledWith("H", "SGW");
    expect(useBuildingEvents).toHaveBeenCalledWith("H", "SGW");
  });

  it("reflects loading state from useBuildingEvents in content props", () => {
    (useBuildingEvents as jest.Mock).mockReturnValue({
      todayEvents: [],
      nextEvent: null,
      loading: true,
    });

    render(<AdditionalInfoPopup {...defaultProps} />);
    const content = screen.getByTestId("mock-content");

    expect(content.props.eventsLoading).toBe(true);
    expect(content.props.todayEvents).toHaveLength(0);
  });

  it("passes nextEvent data when present", () => {
    const mockNextEvent = { id: "2", courseName: "Next Course" };
    (useBuildingEvents as jest.Mock).mockReturnValue({
      todayEvents: [],
      nextEvent: mockNextEvent,
      loading: false,
    });

    render(<AdditionalInfoPopup {...defaultProps} />);
    const content = screen.getByTestId("mock-content");

    expect(content.props.nextEvent).toEqual(mockNextEvent);
  });

  
  it("exposes collapse and minimize methods via ref", () => {
    const ref = createRef<AdditionalInfoPopupHandle>();
    render(<AdditionalInfoPopup {...defaultProps} ref={ref} />);

    
    act(() => {
      ref.current?.collapse();
      ref.current?.minimize();
    });

    expect(mockSnapTo).toHaveBeenCalledWith(400); 
    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });



  it("triggers dismiss and invokes onDirectionsTrigger when directions are pressed", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");

   
    act(() => {
      header.props.onDirectionsPress();
    });

    expect(mockDismiss).toHaveBeenCalled();
    expect(mockOnDirectionsTrigger).toHaveBeenCalledWith(undefined);
  });

  it("passes a string room argument through to onDirectionsTrigger", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.onDirectionsPress("H-820");
    });

    expect(mockDismiss).toHaveBeenCalled();
   
    expect(mockOnDirectionsTrigger).toHaveBeenCalledWith("H-820");
  });

  it("coerces a non-string room argument (e.g. event object) to undefined", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const content = screen.getByTestId("mock-content");

    act(() => {
     
      content.props.onDirectionsPress({ nativeEvent: {} });
    });

    expect(mockDismiss).toHaveBeenCalled();
   
    expect(mockOnDirectionsTrigger).toHaveBeenCalledWith(undefined);
  });

  it("does not throw when onDirectionsTrigger is not provided", () => {
    const { buildingId, campus, onClose, directionsEtaLabel } = defaultProps;
    render(
      <AdditionalInfoPopup
        visible={true}
        buildingId={buildingId}
        campus={campus}
        onClose={onClose}
        directionsEtaLabel={directionsEtaLabel}
       
      />,
    );

    const header = screen.getByTestId("mock-header");

    expect(() => {
      act(() => {
        header.props.onDirectionsPress("H-820");
      });
    }).not.toThrow();

    
    expect(mockDismiss).toHaveBeenCalled();
  });

  
  it("passes the dismiss function from useBottomSheet to PopupHeader as onDismiss", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);
    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.onDismiss();
    });

    expect(mockDismiss).toHaveBeenCalled();
  });

  it("passes handleToggleHeight to PopupHeader as onToggleHeight", () => {
    const mockHandleToggleHeight = jest.fn();
    (useBottomSheet as jest.Mock).mockReturnValue({
      translateY: new Animated.Value(0),
      MAX_HEIGHT: 800,
      SNAP_OFFSET: 400,
      scrollOffsetRef: mockScrollOffsetRef,
      snapTo: mockSnapTo,
      minimize: mockMinimize,
      dismiss: mockDismiss,
      handleToggleHeight: mockHandleToggleHeight,
      handlePanResponder: { panHandlers: {} },
      scrollAreaPanResponder: { panHandlers: {} },
    });

    render(<AdditionalInfoPopup {...defaultProps} />);
    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.onToggleHeight();
    });

    expect(mockHandleToggleHeight).toHaveBeenCalled();
  });


  it("triggers a crossfade animation and snaps to offset when buildingId changes while visible", () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { rerender } = render(
      <AdditionalInfoPopup {...defaultProps} buildingId="H" />,
    );

    mockSnapTo.mockClear();
    timingSpy.mockClear();

    rerender(<AdditionalInfoPopup {...defaultProps} buildingId="MB" />);

    act(() => {
      jest.runAllTimers();
    });

    expect(mockSnapTo).toHaveBeenCalledWith(400);

    expect(timingSpy).toHaveBeenCalledTimes(2);
    expect(timingSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      expect.objectContaining({ toValue: 0, duration: 150 }),
    );
    expect(timingSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      expect.objectContaining({ toValue: 1, duration: 150 }),
    );

    timingSpy.mockRestore();
  });

  it("does NOT animate or snap when buildingId changes while visible is false", () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { rerender } = render(
      <AdditionalInfoPopup {...defaultProps} visible={false} buildingId="H" />,
    );

    mockSnapTo.mockClear();
    timingSpy.mockClear();

    rerender(
      <AdditionalInfoPopup {...defaultProps} visible={false} buildingId="MB" />,
    );

    act(() => {
      jest.runAllTimers();
    });

    
    expect(mockSnapTo).not.toHaveBeenCalled();
    expect(timingSpy).not.toHaveBeenCalled();

    timingSpy.mockRestore();
  });

  it("does NOT animate or snap when rerendered with the same buildingId", () => {
    const timingSpy = jest.spyOn(Animated, "timing");
    const { rerender } = render(
      <AdditionalInfoPopup {...defaultProps} buildingId="H" />,
    );

    mockSnapTo.mockClear();
    timingSpy.mockClear();

    
    rerender(
      <AdditionalInfoPopup
        {...defaultProps}
        buildingId="H"
        directionsEtaLabel="5 min"
      />,
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(mockSnapTo).not.toHaveBeenCalled();
    expect(timingSpy).not.toHaveBeenCalled();

    timingSpy.mockRestore();
  });


  it("handles accessibility increment and decrement correctly", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const header = screen.getByTestId("mock-header");


    act(() => {
      header.props.onDragHandleAccessibilityAction({
        nativeEvent: { actionName: "increment" },
      });
    });
    expect(mockSnapTo).toHaveBeenCalledWith(0);


    act(() => {
      header.props.onDragHandleAccessibilityAction({
        nativeEvent: { actionName: "decrement" },
      });
    });
    expect(mockSnapTo).toHaveBeenCalledWith(400); 
  });

  it("ignores unrecognised accessibility action names without calling snapTo", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);
    const header = screen.getByTestId("mock-header");

    act(() => {
      header.props.onDragHandleAccessibilityAction({
        nativeEvent: { actionName: "activate" },
      });
    });

    expect(mockSnapTo).not.toHaveBeenCalled();
  });


  it("updates scrollOffsetRef when onScroll is called", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const content = screen.getByTestId("mock-content");

    
    act(() => {
      content.props.onScroll({
        nativeEvent: { contentOffset: { y: 150 } },
      });
    });

    expect(mockScrollOffsetRef.current).toBe(150);
  });

  it("updates scrollOffsetRef to 0 when scrolled back to top", () => {
    render(<AdditionalInfoPopup {...defaultProps} />);

    const content = screen.getByTestId("mock-content");

    act(() => {
      content.props.onScroll({ nativeEvent: { contentOffset: { y: 300 } } });
    });
    expect(mockScrollOffsetRef.current).toBe(300);

    act(() => {
      content.props.onScroll({ nativeEvent: { contentOffset: { y: 0 } } });
    });
    expect(mockScrollOffsetRef.current).toBe(0);
  });
});
