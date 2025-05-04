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

// Define the Task type
type Task = {
  id: number;
  label: string;
  checked: boolean;
  category: string;
  priority: "Low" | "Medium" | "High";
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<string>("General");
  const [editingPriority, setEditingPriority] = useState<"Low" | "Medium" | "High">("Low");
  const [newTaskLabel, setNewTaskLabel] = useState<string>("");
  const [newTaskCategory, setNewTaskCategory] = useState<string>("General");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Low");
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
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
        priority: newTaskPriority,
      },
    ]);
    setNewTaskLabel("");
    setNewTaskCategory("General");
    setNewTaskPriority("Low");
    setIsAdding(false);
  };

  const updateTaskLabel = (id: number, newText: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, label: newText } : task
      )
    );
  };

  const saveEdit = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, category: editingCategory, priority: editingPriority }
          : task
      )
    );
    setEditingId(null);
  };

  const deleteTask = (id: number) => {
    const deleted = tasks.find((task) => task.id === id);
    if (!deleted) return;

    setLastDeletedTask(deleted);
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setShowUndo(true);

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
            setEditingPriority(item.priority);
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTask(item.id),
        },
        { text: "Cancel", style: "cancel" },
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

  const filteredTasks = tasks.filter(
    (task) =>
      (priorityFilter === "All" || task.priority === priorityFilter) &&
      (categoryFilter === "All" || task.category === categoryFilter)
  );

  const renderPickerContainer = <T extends string>( 
    selectedValue: T, 
    onValueChange: (value: T) => void, 
    items: { label: string; value: T }[] 
  ) => (
    <View className="rounded-lg border border-white mb-2 w-40 overflow-hidden">
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={{
          backgroundColor: 'black',
          color: 'white',
          width: '100%',
        }}
        dropdownIconColor="white"
      >
        {items.map(({ label, value }) => (
          <Picker.Item key={value} label={label} value={value} />
        ))}
      </Picker>
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
            {editingId !== item.id && (
              <Pressable
                onPress={() => toggleTask(item.id)}
                className={`w-6 h-6 border-2 border-white mr-4 items-center justify-center ${
                  item.checked ? "bg-blue-500" : "bg-transparent"
                }`}
              >
                {item.checked && <Text className="text-white text-xs">✓</Text>}
              </Pressable>
            )}

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
                  {renderPickerContainer(editingCategory, setEditingCategory, [
                    { label: "General", value: "General" },
                    { label: "Work", value: "Work" },
                    { label: "Personal", value: "Personal" },
                    { label: "Urgent", value: "Urgent" },
                  ])}
                  {renderPickerContainer(editingPriority, setEditingPriority, [
                    { label: "Low", value: "Low" },
                    { label: "Medium", value: "Medium" },
                    { label: "High", value: "High" },
                  ])}
                  <Pressable
                    onPress={() => saveEdit(item.id)}
                    className="mt-2 bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-center">Save</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEditingId(null)}
                    className="mt-2 bg-gray-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-center">Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onLongPress={() => handleTaskLongPress(item)}>
                  <Text
                    className={`${
                      item.checked
                        ? "text-gray-400 line-through"
                        : "text-white"
                    }`}
                  >
                    {item.label}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    {item.category} | Priority: {item.priority}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setEditingId(item.id);
                      setEditingCategory(item.category);
                      setEditingPriority(item.priority);
                    }}
                    className="mt-2 bg-blue-500 px-4 py-1 rounded-lg w-24"
                  >
                    <Text className="text-white text-center text-sm">Edit</Text>
                  </Pressable>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 py-16 bg-background items-center px-6">
        <Text className="text-6xl font-bold mb-4 text-white text-center">Hall Pass</Text>

        {renderPickerContainer(priorityFilter, setPriorityFilter, [
          { label: "All Priorities", value: "All" },
          { label: "Low", value: "Low" },
          { label: "Medium", value: "Medium" },
          { label: "High", value: "High" },
        ])}

        {renderPickerContainer(categoryFilter, setCategoryFilter, [
          { label: "All Categories", value: "All" },
          { label: "General", value: "General" },
          { label: "Work", value: "Work" },
          { label: "Personal", value: "Personal" },
          { label: "Urgent", value: "Urgent" },
        ])}

        {filteredTasks.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-lg text-gray-500 mt-4 text-center">No tasks to display.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id.toString()}
            className="w-full mt-4"
            renderItem={({ item }) => renderTask(item)}
          />
        )}

        {!isAdding && (
          <Pressable
            onPress={() => setIsAdding(true)}
            className="mt-6 bg-red-900 px-6 py-3 rounded-lg self-center"
          >
            <Text className="text-white font-semibold">+ Add Task</Text>
          </Pressable>
        )}

        {isAdding && (
          <View className="mt-6 w-full">
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
            {renderPickerContainer(newTaskCategory, setNewTaskCategory, [
              { label: "General", value: "General" },
              { label: "Work", value: "Work" },
              { label: "Personal", value: "Personal" },
              { label: "Urgent", value: "Urgent" },
            ])}
            {renderPickerContainer(newTaskPriority, setNewTaskPriority, [
              { label: "Low", value: "Low" },
              { label: "Medium", value: "Medium" },
              { label: "High", value: "High" },
            ])}
            <Pressable
              onPress={addTask}
              className="bg-green-500 px-6 py-2 rounded-lg mt-2"
            >
              <Text className="text-white text-center">Save Task</Text>
            </Pressable>
          </View>
        )}

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
