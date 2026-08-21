import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getChatHistory, sendChatMessage } from "../api/chat.api";
import { colors, spacing, radius, shadow, typography } from "../theme/theme";

export default function ChatScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      const history = await getChatHistory(tripId);
      setMessages(history.map((m) => ({ ...m, kind: "text" })));
    })();
  }, [tripId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, kind: "text" }]);
    setSending(true);
    try {
      const { reply, tripUpdated, editSummary } = await sendChatMessage(tripId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, kind: "text" }]);
      if (tripUpdated) {
        setMessages((prev) => [...prev, { role: "system", kind: "update", editSummary }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again?", kind: "text" },
      ]);
    } finally {
      setSending(false);
    }
  }

  function renderUpdateBubble(item) {
    const { editSummary } = item;
    const label =
      editSummary?.action === "remove_item"
        ? `Removed ${editSummary.removedPlace?.name || "a stop"} from your plan`
        : `Swapped ${editSummary?.removedPlace?.name || "a stop"} for ${editSummary?.addedPlace?.name || "a new place"}`;

    return (
      <View style={styles.updateCard}>
        <View style={styles.updateHeader}>
          <Ionicons name="checkmark-circle" size={16} color={colors.good} />
          <Text style={styles.updateLabel}>{label}</Text>
        </View>
        <Pressable style={styles.updateButton} onPress={() => navigation.navigate("Itinerary", { tripId })}>
          <Text style={styles.updateButtonText}>View updated itinerary</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.teal} />
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) =>
          item.kind === "update" ? (
            renderUpdateBubble(item)
          ) : (
            <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
                {item.content}
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          <Text style={styles.hint}>
            Say something like "this place is boring" and I can actually swap it for a real alternative.
          </Text>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  messageList: { padding: spacing.md, flexGrow: 1 },
  hint: { ...typography.bodyMuted, textAlign: "center", marginTop: 40, paddingHorizontal: spacing.lg },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 12, marginBottom: 10 },
  bubbleUser: { backgroundColor: colors.teal, alignSelf: "flex-end" },
  bubbleAssistant: { backgroundColor: colors.surfaceAlt, alignSelf: "flex-start" },
  bubbleTextUser: { color: "#fff", fontSize: 15, fontFamily: "PublicSans_400Regular" },
  bubbleTextAssistant: { color: colors.ink, fontSize: 15, fontFamily: "PublicSans_400Regular" },
  updateCard: {
    alignSelf: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: 10,
    maxWidth: "90%",
    ...shadow.card,
  },
  updateHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  updateLabel: { ...typography.body, fontSize: 13, fontFamily: "PublicSans_600SemiBold", flexShrink: 1 },
  updateButton: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  updateButtonText: { color: colors.teal, fontFamily: "PublicSans_600SemiBold", fontSize: 13 },
  inputRow: {
    flexDirection: "row",
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
  },
  sendButton: {
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
