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
import { Picker } from "@react-native-picker/picker";

type Task = {
  id: number;
  label: string;
  checked: boolean;
  category: string;
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("General");
  const [newTaskLabel, setNewTaskLabel] = useState<string>("");
  const [newTaskCategory, setNewTaskCategory] = useState<string>("General");
  const [isAdding, setIsAdding] = useState(false);
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);
  const [showUndo, setShowUndo] = useState(false);

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
    if (newTaskLabel.trim() === "") {
      Alert.alert("Please enter a valid task!");
      return;
    }
    const newId = Date.now();
    setTasks((prev) => [
      ...prev,
      {
        id: newId,
        label: newTaskLabel,
        checked: false,
        category: newTaskCategory,
      },
    ]);
    setNewTaskLabel("");
    setNewTaskCategory("General");
    setIsAdding(false);
  };

  const updateTaskLabel = (id: number, newText: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, label: newText } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    const deleted = tasks.find((task) => task.id === id);
    if (!deleted) return;

    setLastDeletedTask(deleted);
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setShowUndo(true);

    // Hide undo after 5 seconds
    setTimeout(() => {
      setShowUndo(false);
      setLastDeletedTask(null);
    }, 5000);
  };

  const handleTaskLongPress = (item: Task) => {
    Alert.alert(
      "Task Options",
      `"${item.label}"`,
      [
        {
          text: "Edit",
          onPress: () => {
            setEditingId(item.id);
            setEditingCategory(item.category);
          },
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

  const renderRightActions = (item: Task) => (
    <View className="flex flex-row h-full">
      <Pressable
        onPress={() => deleteTask(item.id)}
        className="bg-red-600 justify-center px-4"
      >
        <Text className="text-white font-bold">Delete</Text>
      </Pressable>
    </View>
  );

  const renderTask = (item: Task) => {
    const fadeAnim = new Animated.Value(1);

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
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
          className="mb-3 border-b border-gray-400 w-full px-4"
        >
          <View
            className={`flex flex-row items-center py-3 rounded-lg ${
              item.checked ? "bg-gray-700" : "bg-transparent"
            }`}
          >
            <Pressable
              onPress={() => toggleTask(item.id)}
              className={`w-6 h-6 border-2 border-white mr-4 items-center justify-center ${
                item.checked ? "bg-blue-500" : "bg-transparent"
              }`}
            >
              {item.checked && <Text className="text-white text-xs">✓</Text>}
            </Pressable>

            <View className="flex-1">
              {editingId === item.id ? (
                <View>
                  <TextInput
                    value={item.label}
                    onChangeText={(text) => updateTaskLabel(item.id, text)}
                    autoFocus
                    className="text-black px-2 py-1 rounded-lg border bg-white mb-2"
                    style={{ color: "black" }}
                  />
                  <View className="bg-white rounded-lg">
                    <Picker
                      selectedValue={editingCategory}
                      onValueChange={(value) => setEditingCategory(value)}
                      style={{ color: "black" }}
                    >
                      <Picker.Item label="General" value="General" />
                      <Picker.Item label="Work" value="Work" />
                      <Picker.Item label="Personal" value="Personal" />
                      <Picker.Item label="Urgent" value="Urgent" />
                    </Picker>
                  </View>
                  <Pressable
                    onPress={() => {
                      setTasks((prev) =>
                        prev.map((task) =>
                          task.id === item.id
                            ? { ...task, category: editingCategory }
                            : task
                        )
                      );
                      setEditingId(null);
                    }}
                    className="mt-2 bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-center">Save</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Pressable onLongPress={() => handleTaskLongPress(item)}>
                    <Text
                      className={`${
                        item.checked
                          ? "text-gray-400 line-through"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </Text>
                    <Text className="text-sm text-gray-500">{item.category}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditingId(item.id);
                      setEditingCategory(item.category);
                    }}
                    className="mt-2 bg-blue-500 px-4 py-2 rounded-lg self-start"
                  >
                    <Text className="text-white text-center">Edit</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex flex-1 py-16 bg-background items-center">
        <Text className="text-6xl font-bold text-foreground mb-8">Hall Pass</Text>

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

        {!isAdding && (
          <Pressable
            onPress={() => setIsAdding(true)}
            className="mt-6 bg-red-900 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Add Task</Text>
          </Pressable>
        )}

        {isAdding && (
          <View className="mt-6 w-[90%]">
            <TextInput
              value={newTaskLabel}
              onChangeText={setNewTaskLabel}
              placeholder="Enter task"
              onSubmitEditing={addTask}
              autoFocus
              className="px-4 py-2 border border-gray-400 rounded-lg mb-2"
              style={{ color: "white" }}
              placeholderTextColor="gray"
            />
            <View className="bg-white rounded-lg mb-2">
              <Picker
                selectedValue={newTaskCategory}
                onValueChange={(value) => setNewTaskCategory(value)}
                style={{ color: "black" }}
              >
                <Picker.Item label="General" value="General" />
                <Picker.Item label="Work" value="Work" />
                <Picker.Item label="Personal" value="Personal" />
                <Picker.Item label="Urgent" value="Urgent" />
              </Picker>
            </View>
            <Pressable
              onPress={addTask}
              className="bg-green-500 px-6 py-2 rounded-lg"
            >
              <Text className="text-white text-center">Save Task</Text>
            </Pressable>
          </View>
        )}

        {/* Undo Snackbar */}
        {showUndo && lastDeletedTask && (
          <View className="absolute bottom-4 left-4 right-4 bg-gray-800 px-4 py-3 rounded-lg flex-row justify-between items-center">
            <Text className="text-white flex-1">Task deleted</Text>
            <Pressable
              onPress={() => {
                setTasks((prev) => [...prev, lastDeletedTask]);
                setShowUndo(false);
                setLastDeletedTask(null);
              }}
              className="ml-4"
            >
              <Text className="text-blue-400 font-bold">UNDO</Text>
            </Pressable>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
