import React, { useState, useEffect } from "react";
import 'react-native-gesture-handler';
import {
  Text,
  View,
  Pressable,
  FlatList,
  TextInput,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable } from "react-native-gesture-handler";

type Task = {
  id: number;
  label: string;
  checked: boolean;
  category: string;
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await loadTasks();
      setTasks(saved);
    })();
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const saveTasks = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(tasksToSave));
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  };

  const loadTasks = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("tasks");
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Failed to load tasks", e);
      return [];
    }
  };

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, checked: !task.checked } : task
      )
    );
  };

  const addTask = () => {
    const newId = Date.now();
    setTasks((prev) => [
      ...prev,
      { id: newId, label: `New Task`, checked: false, category: "General" },
    ]);
  };

  const updateTaskLabel = (id: number, newText: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, label: newText } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleTaskLongPress = (item: Task) => {
    Alert.alert(
      "Task Options",
      `"${item.label}"`,
      [
        {
          text: "Edit",
          onPress: () => setEditingId(item.id),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTask(item.id),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (id: number) => (
    <View className="flex justify-center items-end pr-6 bg-red-600 h-full rounded-lg">
      <Pressable onPress={() => deleteTask(id)} className="px-4 py-3">
        <Text className="text-white text-lg font-bold">Delete</Text>
      </Pressable>
    </View>
  );

  const renderTask = (item: Task) => {
    const fadeAnim = new Animated.Value(1);

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          }}
          className="mb-1 border-b border-gray-400 w-full px-4"
        >
          {/* Use Pressable instead of View */}
          <Pressable
            onLongPress={() => handleTaskLongPress(item)} // Long press handler here
            className={`flex flex-row items-center py-3 rounded-lg ${
              item.checked ? "bg-gray-700" : "bg-transparent"
            }`}
          >
            {/* Checkbox */}
            <Pressable
              onPress={() => toggleTask(item.id)}
              className={`w-6 h-6 border-2 border-white mr-4 items-center justify-center ${
                item.checked ? "bg-blue-500" : "bg-transparent"
              }`}
            >
              {item.checked && <Text className="text-white text-xs">✓</Text>}
            </Pressable>

            {/* Label / Input */}
            <View className="flex-1">
              {editingId === item.id ? (
                <TextInput
                  value={item.label}
                  onChangeText={(text) => updateTaskLabel(item.id, text)}
                  onBlur={() => setEditingId(null)} // Lose focus when done
                  autoFocus
                  className="text-black px-2 py-1 rounded-lg border bg-white"
                  style={{ color: "black" }}
                />
              ) : (
                <Pressable onPress={() => handleTaskLongPress(item)}>
                  <Text
                    className={`${
                      item.checked ? "text-gray-400 line-through" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </Text>
                  <Text className="text-sm text-gray-500">{item.category}</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex flex-1 py-16 bg-background items-center">
        {/* Logo */}
        <Text className="text-4xl font-bold text-foreground mb-8">
          Hall Pass
        </Text>

        {/* No tasks prompt */}
        {tasks.length === 0 ? (
          <Text className="text-lg text-gray-500">Please create a task!</Text>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            className="w-[90%]"
            renderItem={({ item }) => renderTask(item)}
          />
        )}

        {/* Add Task Button */}
        <Pressable
          onPress={addTask}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">+ Add Task</Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}
