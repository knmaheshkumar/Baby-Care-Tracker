import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function App() {
  const [babies, setBabies] = useState([]);
  const [currentBaby, setCurrentBaby] = useState("");
  const [records, setRecords] = useState([]);
  const [customType, setCustomType] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const b = await AsyncStorage.getItem("babies");
      const r = await AsyncStorage.getItem("records");

      if (b) setBabies(JSON.parse(b));
      if (r) setRecords(JSON.parse(r));
    } catch (e) {
      console.log(e);
    }
  };

  const saveBabies = async (data) => {
    setBabies(data);
    await AsyncStorage.setItem("babies", JSON.stringify(data));
  };

  const saveRecords = async (data) => {
    setRecords(data);
    await AsyncStorage.setItem("records", JSON.stringify(data));
  };

  const addBaby = async (name) => {
    if (!name) return;

    if (babies.includes(name)) {
      Alert.alert("Baby already exists");
      return;
    }

    const updated = [...babies, name];
    await saveBabies(updated);
    setCurrentBaby(name);
  };

  const addRecord = async (type, label = "") => {
    if (!currentBaby) {
      Alert.alert("Please add/select a baby first");
      return;
    }

    const newRecord = {
      baby: currentBaby,
      type,
      label,
      dateTime: new Date().toISOString()
    };

    const updated = [newRecord, ...records];
    await saveRecords(updated);
  };

  const exportExcel = async () => {
    if (records.length === 0) {
      Alert.alert("No data to export");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(records);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Baby Data");

    const wbout = XLSX.write(wb, {
      type: "base64",
      bookType: "xlsx"
    });

    const uri = FileSystem.documentDirectory + "baby_tracker.xlsx";

    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64
    });

    await Sharing.shareAsync(uri);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.baby === currentBaby &&
      new Date(r.dateTime).toDateString() ===
        selectedDate.toDateString()
  );

  return (
    <View style={{ padding: 20, marginTop: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        🍼 Baby Care Tracker
      </Text>

      {/* Baby Selection */}
      <Text style={{ marginTop: 10 }}>Select Baby:</Text>
      <FlatList
        horizontal
        data={babies}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setCurrentBaby(item)}
            style={{
              padding: 8,
              backgroundColor:
                currentBaby === item ? "#aee" : "#ddd",
              margin: 5,
              borderRadius: 10
            }}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Add Baby */}
      <TextInput
        placeholder="Add Baby Name"
        onSubmitEditing={(e) => addBaby(e.nativeEvent.text)}
        style={{
          borderWidth: 1,
          padding: 8,
          marginVertical: 10,
          borderRadius: 8
        }}
      />

      {/* Default Tracking */}
      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => addRecord("Diaper Change")}
      >
        <Text>💩 Diaper Change</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => addRecord("Wet Diaper")}
      >
        <Text>💧 Wet Diaper</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginVertical: 5 }}
        onPress={() => addRecord("Feeding")}
      >
        <Text>🍼 Feeding</Text>
      </TouchableOpacity>

      {/* Custom Tracking */}
      <TextInput
        placeholder="Custom (e.g. Medicine)"
        value={customType}
        onChangeText={setCustomType}
        style={{
          borderWidth: 1,
          padding: 8,
          marginVertical: 10,
          borderRadius: 8
        }}
      />

      <TouchableOpacity
        onPress={() => {
          if (!customType) return;
          addRecord("Custom", customType);
          setCustomType("");
        }}
      >
        <Text>➕ Add Custom Event</Text>
      </TouchableOpacity>

      {/* Calendar */}
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <Text style={{ marginVertical: 10 }}>📅 Select Date</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          onChange={(e, date) => {
            setShowPicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={{ marginVertical: 2 }}>
            {item.type}
            {item.label ? ` (${item.label})` : ""} -{" "}
            {new Date(item.dateTime).toLocaleString()}
          </Text>
        )}
      />

      {/* Export */}
      <TouchableOpacity onPress={exportExcel}>
        <Text style={{ marginTop: 20 }}>📥 Export to Excel</Text>
      </TouchableOpacity>
    </View>
  );
}