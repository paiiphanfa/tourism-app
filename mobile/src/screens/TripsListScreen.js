import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { listTrips } from "../api/trip.api";
import { colors, spacing, radius, shadow, typography } from "../theme/theme";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

const STATUS_LABEL = { generating: "Generating…", ready: "Ready", failed: "Failed" };
const STATUS_COLOR = { generating: colors.gold, ready: colors.good, failed: colors.bad };

function relativeDate(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(dateString).toLocaleDateString();
}

export default function TripsListScreen({ navigation }) {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listTrips()
        .then((data) => !cancelled && setTrips(data))
        .catch((err) => !cancelled && setError(err.response?.data?.error || "Could not load trips"));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (error) {
    return <EmptyState icon="alert-circle-outline" title="Something went wrong" message={error} />;
  }

  if (trips === null) {
    return <LoadingSpinner />;
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        icon="airplane-outline"
        title="No trips yet"
        message="Plan your first trip and we'll build a real day-by-day itinerary for you."
        actionLabel="Plan your first trip"
        onAction={() => navigation.navigate("NewTrip")}
      />
    );
  }

  return (
    <FlatList
      data={trips}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => item.status === "ready" && navigation.navigate("Itinerary", { tripId: item._id })}
        >
          <View style={styles.cardTop}>
            <Text style={styles.destination}>{item.destination}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + "22" }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText}>
              {item.durationDays} day{item.durationDays > 1 ? "s" : ""} · {relativeDate(item.createdAt)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  destination: { ...typography.h3 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  badgeText: { fontFamily: "PublicSans_600SemiBold", fontSize: 12 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  metaText: { ...typography.bodyMuted },
});
