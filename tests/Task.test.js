import { render, screen, userEvent } from "@testing-library/react-native";
import { TaskItem } from "../app/index";

// ... other imports and setup

test("toggles completion status when pressed", async () => {
  const mockToggle = jest.fn();
  const task = {
    id: 1,
    title: "Test Task",
    category: "Test Category",
    isChecked: false,
  };

  render(<TaskItem task={task} onUpdate={mockToggle} />);

  const checkbox = screen.getByTestId("checkbox");

  const user = userEvent.setup();
  await user.press(checkbox);

  // Check if our mock function was called
  expect(mockToggle).toHaveBeenCalled();
  // Check if our mock function was called with the correct arguments
  expect(mockToggle).toHaveBeenCalledWith({
    ...task,
    isChecked: true  // The checkbox should toggle from false to true
  });
});