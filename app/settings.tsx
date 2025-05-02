import * as React from "react";
import { View, Pressable } from "react-native";
import { Text } from "~/components/ui/text";

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Toggle between light and dark modes
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <View
      className={`flex-1 justify-center items-center ${
        isDarkMode ? "bg-black" : "bg-white"
      }`}
    >
      <Text className={`${isDarkMode ? "text-white" : "text-black"}`}>
        Settings Screen
      </Text>

      {/* Button to toggle between dark and light modes */}
      <Pressable
        onPress={toggleTheme}
        className={`mt-4 px-6 py-3 rounded-lg ${
          isDarkMode ? "bg-white" : "bg-black"
        }`}
      >
        <Text className={`${isDarkMode ? "text-black" : "text-white"}`}>
          Toggle Theme
        </Text>
      </Pressable>
    </View>
  );
}
