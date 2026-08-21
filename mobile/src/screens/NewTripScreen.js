import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { createTrip } from "../api/trip.api";
import { getProvinces } from "../api/reference.api";
import { colors, spacing, radius, typography } from "../theme/theme";
import SelectField from "../components/SelectField";

const PREFERENCE_OPTIONS = ["temple", "cafe", "nature", "market", "viewpoint", "food", "quiet", "family"];

export default function NewTripScreen({ navigation }) {
  const [provinces, setProvinces] = useState([]);
  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [durationDays, setDurationDays] = useState(3);
  const [preferences, setPreferences] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getProvinces()
      .then(setProvinces)
      .catch(() => setError("Could not load the province list — check your connection."));
  }, []);

  const provinceOptions = provinces.map((p) => ({ label: p.nameEn, value: p.nameEn }));
  const selectedProvince = provinces.find((p) => p.nameEn === province);
  const districtOptions = selectedProvince ? selectedProvince.districts.map((d) => ({ label: d, value: d })) : [];

  function togglePreference(tag) {
    setPreferences((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit() {
    if (!province) {
      setError("Pick a province to continue");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let location;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }

      const trip = await createTrip({ destination: province, district, durationDays, preferences, location });
      navigation.replace("Itinerary", { tripId: trip._id });
    } catch (err) {
      setError(err.response?.data?.error || "Could not create trip");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Plan a trip</Text>

      <View style={styles.field}>
        <SelectField
          label="Province"
          placeholder="Where in Thailand?"
          value={province}
          options={provinceOptions}
          onSelect={(val) => {
            setProvince(val);
            setDistrict(null);
          }}
        />
      </View>

      <View style={styles.field}>
        <SelectField
          label="District (optional)"
          placeholder={province ? "Any district" : "Pick a province first"}
          value={district}
          options={districtOptions}
          onSelect={setDistrict}
          disabled={!province}
        />
      </View>

      <Text style={styles.label}>How many days?</Text>
      <View style={styles.stepperRow}>
        <Pressable style={styles.stepperButton} onPress={() => setDurationDays((d) => Math.max(1, d - 1))}>
          <Ionicons name="remove" size={20} color={colors.teal} />
        </Pressable>
        <Text style={styles.stepperValue}>{durationDays}</Text>
        <Pressable style={styles.stepperButton} onPress={() => setDurationDays((d) => Math.min(14, d + 1))}>
          <Ionicons name="add" size={20} color={colors.teal} />
        </Pressable>
      </View>

      <Text style={styles.label}>Interests (optional)</Text>
      <View style={styles.chipRow}>
        {PREFERENCE_OPTIONS.map((tag) => {
          const selected = preferences.includes(tag);
          return (
            <Pressable
              key={tag}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => togglePreference(tag)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate itinerary</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  title: { ...typography.h1, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.sm },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.tealSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { ...typography.h3, minWidth: 30, textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { ...typography.body, fontSize: 14 },
  chipTextSelected: { color: "#fff", fontFamily: "PublicSans_600SemiBold" },
  button: { backgroundColor: colors.teal, borderRadius: radius.sm, padding: 16, alignItems: "center", marginTop: spacing.xl },
  buttonText: { ...typography.button },
  error: { color: colors.bad, marginTop: spacing.md, ...typography.bodyMuted },
});
