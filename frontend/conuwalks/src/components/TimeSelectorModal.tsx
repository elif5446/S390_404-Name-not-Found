import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";

interface TimeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (mode: "leave" | "arrive", date: Date | null) => void;
  initialMode: "leave" | "arrive";
  initialDate: Date | null;
}

const ITEM_HEIGHT = 44;

const toYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const generateDays = () => {
  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      value: toYMD(d),
      label:
        i === 0
          ? "Today"
          : d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
    });
  }
  return days;
};

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, "0"),
}));

const MINUTES = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  label: (i * 5).toString().padStart(2, "0"),
}));

const WheelPicker = ({
  data,
  selectedValue,
  onValueChange,
  width,
  isDark,
  loop = false,
}: any) => {
  const flatListRef = useRef<FlatList>(null);

  // faking infinity: 50 clones is plenty. useMemo prevents recreating this array on every render.
  const REPEAT_COUNT = loop ? 50 : 1;
  const loopedData = useMemo(
    () => Array.from({ length: REPEAT_COUNT }).flatMap(() => data),
    [data, loop],
  );

  const originalIndex = data.findIndex((d: any) => d.value === selectedValue);
  const safeOriginalIndex = originalIndex >= 0 ? originalIndex : 0;

  const centerOffset = loop ? Math.floor(REPEAT_COUNT / 2) * data.length : 0;
  const startIndex = centerOffset + safeOriginalIndex;

  const handleScrollEnd = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.min(Math.max(0, index), loopedData.length - 1);

    const realItem = loopedData[clampedIndex];
    if (realItem && realItem.value !== selectedValue) {
      onValueChange(realItem.value);
    }

    // silent recenter: snap back to the middle if they scroll too close to the edges
    if (loop) {
      const buffer = data.length * 5;
      if (clampedIndex < buffer || clampedIndex > loopedData.length - buffer) {
        const recenterIndex = centerOffset + (clampedIndex % data.length);
        flatListRef.current?.scrollToOffset({
          offset: recenterIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }
  };

  // required by FlatList for initialScrollIndex to jump instantly without measuring
  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  return (
    <View style={{ height: ITEM_HEIGHT * 5, width }}>
      <FlatList
        ref={flatListRef}
        data={loopedData}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={getItemLayout}
        initialScrollIndex={startIndex}
        initialNumToRender={10}
        windowSize={3}
        maxToRenderPerBatch={10}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        renderItem={({ item }) => (
          <View style={styles.wheelItem}>
            <Text
              style={[
                styles.wheelText,
                {
                  color:
                    selectedValue === item.value
                      ? "#B03060"
                      : isDark
                        ? "#AFAFAF"
                        : "#8E8E93",
                },
              ]}
            >
              {item.label}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default function TimeSelectorModal({
  visible,
  onClose,
  onApply,
  initialMode,
  initialDate,
}: TimeSelectorModalProps) {
  const isDark = (useColorScheme() || "light") === "dark";
  const [mode, setMode] = useState<"leave" | "arrive">(initialMode);

  const defaultDate = initialDate || new Date();
  const [selectedDayString, setSelectedDayString] = useState(
    defaultDate.toISOString(),
  );

  // Initialize with 24-hour time
  const [selectedHour, setSelectedHour] = useState(defaultDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    (Math.round(defaultDate.getMinutes() / 5) * 5) % 60,
  );

  const days = useRef(generateDays()).current;

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      const activeDate = initialDate || new Date();
      setSelectedDayString(toYMD(activeDate));
      setSelectedHour(activeDate.getHours());
      setSelectedMinute((Math.round(activeDate.getMinutes() / 5) * 5) % 60);
    }
  }, [visible, initialDate, initialMode]);

  const handleApply = () => {
    const [year, month, day] = selectedDayString.split("-").map(Number);
    const finalDate = new Date();
    finalDate.setFullYear(year, month - 1, day);
    finalDate.setHours(selectedHour, selectedMinute, 0, 0);

    onApply(mode, finalDate);
  };

  const handleReset = () => {
    onApply("leave", null); // null represents "Leave Now"
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            { backgroundColor: isDark ? "#2C2C2E" : "#FFFFFF" },
          ]}
        >
          {Platform.OS === "ios" && (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === "leave" && styles.tabActive]}
              onPress={() => setMode("leave")}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "leave" && styles.tabTextActive,
                ]}
              >
                Leave
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "arrive" && styles.tabActive]}
              onPress={() => setMode("arrive")}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "arrive" && styles.tabTextActive,
                ]}
              >
                Arrive
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pickers */}
          <View style={styles.pickerRow} key={visible ? "open" : "closed"}>
            <View
              style={[
                styles.sharedHighlight,
                { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA" },
              ]}
              pointerEvents="none"
            />
            <WheelPicker
              data={days}
              selectedValue={selectedDayString}
              onValueChange={setSelectedDayString}
              width="50%"
              isDark={isDark}
              loop={false}
            />
            <WheelPicker
              data={HOURS}
              selectedValue={selectedHour}
              onValueChange={setSelectedHour}
              width="25%"
              isDark={isDark}
              loop={true}
            />
            <WheelPicker
              data={MINUTES}
              selectedValue={selectedMinute}
              onValueChange={setSelectedMinute}
              width="25%"
              isDark={isDark}
              loop={true}
            />
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.footerBtn}>
              <Text
                style={[styles.footerText, { color: isDark ? "#FFF" : "#000" }]}
              >
                Leave now
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              style={[styles.footerBtn, styles.applyBtn]}
            >
              <Text style={styles.applyText}>Set time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
    paddingTop: 16,
    overflow: "hidden",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(118, 118, 128, 0.12)",
    borderRadius: 8,
    padding: 2,
    marginBottom: 20,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActive: {
    backgroundColor: "#B03060",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontWeight: "600", fontSize: 14, color: "#8E8E93" },
  tabTextActive: { color: "#FFFFFF" },
  pickerRow: {
    flexDirection: "row",
    position: "relative",
  },
  sharedHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  wheelText: { fontSize: 18, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(118, 118, 128, 0.12)",
  },
  applyBtn: { backgroundColor: "#B03060" },
  footerText: { fontWeight: "600", fontSize: 16 },
  applyText: { color: "#FFF", fontWeight: "600", fontSize: 16 },
});
