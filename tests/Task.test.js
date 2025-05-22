import { render, screen, userEvent } from "@testing-library/react-native";
import { TaskItem } from "../app/index";

// Inline mock for 'react-native-gesture-handler'
jest.mock("react-native-gesture-handler", () => ({
  Swipeable: jest.fn(({ children }) => children),
}));
// Mock '@react-native-async-storage/async-storage'
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

test("toggles completion status when pressed", async () => {
  const mockToggle = jest.fn();
  const task = {
    id: 1,
    title: "Test Task",
    category: "Test Category",
    checked: false,
  };

  render(<TaskItem item={task} onToggle={mockToggle} />);

  const checkbox = screen.getByTestId("checkbox");

  const user = userEvent.setup();
  await user.press(checkbox);

  // Check if our mock function was called
  expect(mockToggle).toHaveBeenCalled();
});