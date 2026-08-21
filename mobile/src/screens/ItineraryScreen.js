import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getTrip } from "../api/trip.api";
import { colors, spacing, radius, shadow, typography } from "../theme/theme";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { buildMapsUrl } from "../utils/maps";

const TRANSPORT_ICON = {
  walk: "walk-outline",
  "tuk-tuk/taxi/Grab": "car-outline",
  "car/van": "car-sport-outline",
};

function placeLatLng(item) {
  const place = item.placeId;
  if (!place || !place.location) return null;
  const [lng, lat] = place.location.coordinates;
  return { lat, lng };
}

export default function ItineraryScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getTrip(tripId)
        .then((data) => !cancelled && setTrip(data))
        .catch((err) => !cancelled && setError(err.response?.data?.error || "Could not load trip"));
      return () => {
        cancelled = true;
      };
    }, [tripId])
  );

  if (error) {
    return <EmptyState icon="alert-circle-outline" title="Something went wrong" message={error} />;
  }

  if (!trip) {
    return <LoadingSpinner />;
  }

  if (trip.status === "failed") {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Couldn't build this itinerary"
        message={trip.rawItineraryText || "Something went wrong generating this trip."}
      />
    );
  }

  const currentDay = trip.days.find((d) => d.dayNumber === activeDay) || trip.days[0];
  const sortedItems = currentDay?.items.slice().sort((a, b) => a.order - b.order) || [];

  function openMaps(scope) {
    const items = scope === "day" ? sortedItems : trip.days.flatMap((d) => d.items.slice().sort((a, b) => a.order - b.order));
    const coords = items.map(placeLatLng).filter(Boolean);
    const url = buildMapsUrl(coords);
    if (url) Linking.openURL(url);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>
          {trip.destination}
          {trip.district ? ` · ${trip.district}` : ""} · {trip.durationDays} day{trip.durationDays > 1 ? "s" : ""}
        </Text>
        {trip.rawItineraryText ? <Text style={styles.narrative}>{trip.rawItineraryText}</Text> : null}

        <View style={styles.dayTabs}>
          {trip.days.map((d) => (
            <Pressable
              key={d.dayNumber}
              style={[styles.dayTab, activeDay === d.dayNumber && styles.dayTabActive]}
              onPress={() => setActiveDay(d.dayNumber)}
            >
              <Text style={[styles.dayTabText, activeDay === d.dayNumber && styles.dayTabTextActive]}>
                Day {d.dayNumber}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.mapsRow}>
          <Pressable style={styles.mapsButton} onPress={() => openMaps("day")}>
            <Ionicons name="navigate-outline" size={16} color={colors.teal} />
            <Text style={styles.mapsButtonText}>Open Day in Maps</Text>
          </Pressable>
          <Pressable style={styles.mapsButton} onPress={() => openMaps("trip")}>
            <Ionicons name="map-outline" size={16} color={colors.teal} />
            <Text style={styles.mapsButtonText}>Open Full Trip</Text>
          </Pressable>
        </View>

        {currentDay?.summary ? <Text style={styles.daySummary}>{currentDay.summary}</Text> : null}

        {sortedItems.map((item, idx) => {
          const place = item.placeId;
          return (
            <View key={idx}>
              {item.travelFromPrevious ? (
                <View style={styles.travelRow}>
                  <Ionicons
                    name={TRANSPORT_ICON[item.travelFromPrevious.mode] || "arrow-down-outline"}
                    size={14}
                    color={colors.muted}
                  />
                  <Text style={styles.travelText}>
                    {item.travelFromPrevious.distanceKm} km · {item.travelFromPrevious.mode}
                  </Text>
                </View>
              ) : null}
              <View style={styles.card}>
                <Text style={styles.cardTime}>
                  {item.startTime || ""}
                  {item.endTime ? ` – ${item.endTime}` : ""}
                </Text>
                <Text style={styles.cardTitle}>{place?.name || "Unknown place"}</Text>
                <Text style={styles.cardCategory}>{place?.category}</Text>
                {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Pressable style={styles.chatButton} onPress={() => navigation.navigate("Chat", { tripId: trip._id })}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
        <Text style={styles.chatButtonText}>Chat about this trip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.lg, paddingBottom: 110 },
  title: { ...typography.h1, fontSize: 24, marginBottom: spacing.xs },
  narrative: { ...typography.bodyMuted, marginBottom: spacing.lg, lineHeight: 20 },
  dayTabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  dayTabActive: { backgroundColor: colors.teal },
  dayTabText: { fontFamily: "PublicSans_600SemiBold", color: colors.ink },
  dayTabTextActive: { color: "#fff" },
  mapsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  mapsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  mapsButtonText: { fontFamily: "PublicSans_600SemiBold", color: colors.teal, fontSize: 13 },
  daySummary: { ...typography.bodyMuted, marginBottom: spacing.md, fontStyle: "italic" },
  travelRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: spacing.md, marginBottom: spacing.xs },
  travelText: { ...typography.bodyMuted, fontSize: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardTime: { fontSize: 12, color: colors.gold, fontFamily: "PublicSans_600SemiBold", marginBottom: 4 },
  cardTitle: { ...typography.h3 },
  cardCategory: { fontSize: 12, color: colors.muted, textTransform: "uppercase", marginTop: 2, letterSpacing: 0.5 },
  cardNote: { ...typography.bodyMuted, marginTop: spacing.sm, lineHeight: 19 },
  chatButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    padding: 16,
    ...shadow.card,
  },
  chatButtonText: { ...typography.button },
});
