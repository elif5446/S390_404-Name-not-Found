import { View, Text, Button, StyleSheet } from "react-native";
import { useState } from "react";
import { pingBackend, sendTestData } from "@/src/api/tester";
type ApiResult = Record<string, unknown>;

export default function TesterPage() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePing() {
    setLoading(true);
    try {
      const res = await pingBackend();
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    setLoading(true);
    try {
      const res = await sendTestData({
        user: "expo-test",
        message: "Frontend talking to backend",
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Test Page</Text>

      <Button title="Ping Backend" onPress={handlePing} disabled={loading} />
      <Button title="Send Test POST" onPress={handlePost} disabled={loading} />

      {result && (
        <Text style={styles.result}>
          {JSON.stringify(result, null, 2)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "bold" },
  result: { marginTop: 10, fontFamily: "monospace" },
});
