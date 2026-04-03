import { render, screen, fireEvent } from "@testing-library/react-native";
import CollapsibleUserProfile from "../../components/CollapsibleUserProfile";
import { Platform } from "react-native/Libraries/Utilities/Platform";

process.env.EXPO_OS = "ios";

// Mocks
jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => children,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: (props: any) => props.children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe("CollapsibleUserProfile", () => {
  const mockUserInfo = {
    name: "John Tester",
    email: "john@concordia.ca",
    photo: "test-url",
  };
  const mockSignOut = jest.fn();

  it("starts in collapsed state (only shows profile icon)", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );
    expect(screen.getByLabelText("Open user profile")).toBeTruthy();
    expect(screen.queryByText("John Tester")).toBeNull();
  });

  it("expands to show user details when pressed", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );
    fireEvent.press(screen.getByLabelText("Open user profile"));

    expect(screen.getByText("John Tester")).toBeTruthy();
    expect(screen.getByText("Sign Out")).toBeTruthy();
  });

  it("collapses and hides details when the close button is pressed", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );

    fireEvent.press(screen.getByLabelText("Open user profile"));
    expect(screen.getByText("John Tester")).toBeTruthy();

    const closeBtn = screen.getByLabelText("Close Profile");
    fireEvent.press(closeBtn);

    expect(screen.queryByText("John Tester")).toBeNull();
  });

  it("calls onSignOut when the sign out button is pressed", () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />,
    );
    fireEvent.press(screen.getByLabelText("Open user profile"));

    const signOutBtn = screen.getByText("Sign Out");
    fireEvent.press(signOutBtn);

    expect(mockSignOut).toHaveBeenCalled();
  });

  describe("UserAvatar Fallback Logic", () => {
    it("renders the first letter of the user's name when no photo is provided", () => {
      const userWithoutPhoto = {
        name: "Alice",
        email: "alice@concordia.ca",
      };
      
      render(
        <CollapsibleUserProfile
          userInfo={userWithoutPhoto}
          onSignOut={mockSignOut}
        />
      );

      expect(screen.getByText("A")).toBeTruthy();
      
      fireEvent.press(screen.getByLabelText("Open user profile"));
      expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    });

    it("renders 'U' as a fallback when neither photo nor name is provided", () => {
      const mysteryUser = {
        email: "mystery@concordia.ca"
      };
      
      render(
        <CollapsibleUserProfile
          userInfo={mysteryUser}
          onSignOut={mockSignOut}
        />
      );

      expect(screen.getByText("U")).toBeTruthy();
    });
  });

  it("collapses the profile when the background overlay is pressed", async () => {
    render(
      <CollapsibleUserProfile
        userInfo={mockUserInfo}
        onSignOut={mockSignOut}
      />
    );

    fireEvent.press(screen.getByLabelText("Open user profile"));
    expect(screen.getByText("John Tester")).toBeTruthy();

    const overlay = screen.getByTestId("profile-overlay");
    fireEvent.press(overlay);

    expect(screen.queryByText("John Tester")).toBeNull();
    
    expect(screen.getByLabelText("Open user profile")).toBeTruthy();
  });

  describe("Expanded Background Colors (Android/Non-iOS)", () => {
    const RN = require("react-native");
    let originalOS: string;

    beforeEach(() => {
      originalOS = RN.Platform.OS;
      
      Object.defineProperty(RN.Platform, "OS", { 
        get: () => "android", 
        configurable: true
      });
    });

    afterEach(() => {
      Object.defineProperty(RN.Platform, "OS", { 
        get: () => originalOS, 
        configurable: true 
      });
      jest.restoreAllMocks();
    });

    it("applies the dark mode background color", () => {
      jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");

      render(<CollapsibleUserProfile userInfo={mockUserInfo} onSignOut={mockSignOut} />);
      
      fireEvent.press(screen.getByLabelText("Open user profile"));

      const container = screen.getByTestId("expanded-content-container");
      expect(container.props.style.backgroundColor).toBe("#1C1B1F");
    });

    it("applies the light mode background color", () => {
      jest.spyOn(RN, "useColorScheme").mockReturnValue("light");

      render(<CollapsibleUserProfile userInfo={mockUserInfo} onSignOut={mockSignOut} />);
      
      fireEvent.press(screen.getByLabelText("Open user profile"));

      const container = screen.getByTestId("expanded-content-container");
      expect(container.props.style.backgroundColor).toBe("rgba(255, 255, 255, 0.95)");
    });
  });
});
