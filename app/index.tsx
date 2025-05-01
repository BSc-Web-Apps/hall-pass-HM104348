import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";

export default function HomeScreen() {
  const [checked, setChecked] = useState(false);

  return (
    <View className="flex flex-1 py-16 bg-background items-center">
      {/* Text Logo at the top */}
      <Text className="text-4xl font-bold text-foreground mb-8">Hall Pass</Text>

      <View className="flex flex-row h-20 w-[90%] border-2 border-gray-400 items-center px-4">
        {/* Custom Checkbox */}
        <Pressable
          onPress={() => setChecked(!checked)}
          className={`w-6 h-6 border-2 border-white mr-4 items-center justify-center ${
            checked ? "bg-blue-500" : "bg-transparent"
          }`}
        >
          {checked && <Text className="text-white text-xs">✓</Text>}
        </Pressable>

        {/* Label */}
        <View className="flex flex-1 h-full justify-center">
          <Text className="text-foreground">Feed the cat</Text>
        </View>
      </View>
    </View>
  );
}
