import React, { useState, useEffect, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import { CircleCheck } from "lucide-react-native";

// Define the Task type
type Task = {
  id: number;
  label: string;
  checked: boolean;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
};

// TaskItem component
export const TaskItem = ({
  item,
  onDelete,
  onToggle,
  onLongPress,
  onEdit,
}: {
  item: Task;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onLongPress: (item: Task) => void;
  onEdit: (item: Task) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const renderRightActions = () => (
    <View className="flex flex-row h-full">
      <Pressable
        onPress={() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => onDelete(item.id));
        }}
        className="bg-red-600 justify-center px-4"
      >
        <Text className="text-white font-bold">Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Animated.View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
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
        {/* Checkbox */}
        <Pressable
          onPress={() => onToggle(item.id)}
          className={`w-6 h-6 border-2 border-white mr-4 items-center justify-center ${
            item.checked ? "bg-blue-500" : "bg-transparent"
          }`}
        >
          {item.checked && <Text className="text-white text-xs">✓</Text>}
        </Pressable>

        {/* Task details */}
        <Pressable onLongPress={() => onLongPress(item)} className="flex flex-row flex-1 justify-between items-center py-3">
          <View className="flex flex-col">
            <Text
              className={`text-white ${item.checked ? "line-through text-gray-400" : ""}`}
            >
              {item.label}
            </Text>
            <Text className="text-sm text-gray-400">
              {item.category} | Priority: {item.priority}
            </Text>
          </View>

          {/* Edit button */}
          <Pressable
            onPress={() => onEdit(item)}
            className="mt-2 bg-blue-500 px-4 py-1 rounded-lg w-24"
          >
            <Text className="text-white text-center text-sm">Edit</Text>
          </Pressable>
        </Pressable>
      </Animated.View>
    </Swipeable>
  );
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState("General");
  const [editingPriority, setEditingPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Low");
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("General");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Low");
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const fadeAnimUndo = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const saved = await loadTasks();
      setTasks(saved);
    })();
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

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
    Keyboard.dismiss();
  };

  const deleteTask = (id: number) => {
    const deleted = tasks.find((task) => task.id === id);
    if (!deleted) return;
    setLastDeletedTask(deleted);
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setShowUndo(true);
    Animated.timing(fadeAnimUndo, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.timing(fadeAnimUndo, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowUndo(false);
        setLastDeletedTask(null);
      });
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
            setNewTaskLabel(item.label);
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
        style={{ backgroundColor: 'black', color: 'white', width: '100%' }}
        dropdownIconColor="white"
      >
        {items.map(({ label, value }) => (
          <Picker.Item key={value} label={label} value={value} />
        ))}
      </Picker>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background items-center px-6 pt-16"
      >
        <View className="flex flex-row gap-5">
          <Text className="text-6xl font-bold mb-4 text-white text-center">HallPass</Text>
          <CircleCheck size={60} color="#614E48" />
        </View>

        {filteredTasks.length > 0 && (
          <>
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
          </>
        )}

        {filteredTasks.length === 0 ? (
          <Text className="text-lg text-gray-500 mt-4 text-center">No tasks to display.</Text>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id.toString()}
            className="w-full mt-4"
            renderItem={({ item }) => (
              <TaskItem
                item={item}
                onDelete={deleteTask}
                onToggle={toggleTask}
                onLongPress={handleTaskLongPress}
                onEdit={(task) => {
                  setEditingId(task.id);
                  setNewTaskLabel(task.label);
                  setEditingCategory(task.category);
                  setEditingPriority(task.priority);
                }}
              />
            )}
          />
        )}

        {isAdding && (
          <View className="mt-6 w-full">
            <TextInput
              ref={inputRef}
              value={newTaskLabel}
              onChangeText={setNewTaskLabel}
              placeholder="Enter task"
              placeholderTextColor="gray"
              onSubmitEditing={addTask}
              className="px-4 py-2 border border-gray-400 rounded-lg mb-2 text-white"
            />
            {renderPickerContainer(newTaskCategory, setNewTaskCategory, [
              { label: "General", value: "General" },
              { label: "Work", value: "Work" },
              { label: "Personal", value: "Personal" },
            ])}
            {renderPickerContainer(newTaskPriority, setNewTaskPriority, [
              { label: "Low", value: "Low" },
              { label: "Medium", value: "Medium" },
              { label: "High", value: "High" },
              { label: "Urgent", value: "Urgent" },
            ])}
            <Pressable onPress={addTask} className="bg-green-500 px-6 py-2 rounded-lg mt-2">
              <Text className="text-white text-center">Save Task</Text>
            </Pressable>
          </View>
        )}

        {editingId !== null && (
          <View className="mt-6 w-full">
            <TextInput
              value={newTaskLabel}
              onChangeText={setNewTaskLabel}
              placeholder="Edit task"
              placeholderTextColor="gray"
              className="px-4 py-2 border border-gray-400 rounded-lg mb-2 text-white"
              autoFocus
            />
            {renderPickerContainer(editingCategory, setEditingCategory, [
              { label: "General", value: "General" },
              { label: "Work", value: "Work" },
              { label: "Personal", value: "Personal" },
            ])}
            {renderPickerContainer(editingPriority, setEditingPriority, [
              { label: "Low", value: "Low" },
              { label: "Medium", value: "Medium" },
              { label: "High", value: "High" },
              { label: "Urgent", value: "Urgent" },
            ])}
            <Pressable
              onPress={() => {
                setTasks((prev) =>
                  prev.map((task) =>
                    task.id === editingId
                      ? { ...task, label: newTaskLabel.trim(), category: editingCategory, priority: editingPriority }
                      : task
                  )
                );
                setEditingId(null);
                setNewTaskLabel("");
              }}
              className="bg-green-500 px-6 py-2 rounded-lg mt-2"
            >
              <Text className="text-white text-center">Save Changes</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setEditingId(null);
                setNewTaskLabel("");
              }}
              className="bg-red-600 px-6 py-2 rounded-lg mt-2"
            >
              <Text className="text-white text-center">Cancel</Text>
            </Pressable>
          </View>
        )}

        {!isAdding && editingId === null && (
          <View className="absolute bottom-6 w-full flex items-center justify-center">
            <Pressable
              onPress={() => setIsAdding(true)}
              className="bg-red-900 w-16 h-16 rounded-full justify-center items-center"
            >
              <Text className="text-white text-3xl font-bold">+</Text>
            </Pressable>
          </View>
        )}

        {showUndo && lastDeletedTask && (
          <Animated.View
            style={{
              opacity: fadeAnimUndo,
              position: "absolute",
              bottom: 80,
              right: 16,
            }}
          >
            <Pressable
              onPress={() => {
                setTasks((prev) => [...prev, lastDeletedTask]);
                setShowUndo(false);
              }}
              className="bg-red-900 rounded-full w-16 h-16 justify-center items-center"
            >
              <Text className="text-white text-lg">Undo</Text>
            </Pressable>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    
    </TouchableWithoutFeedback>
  );
}
