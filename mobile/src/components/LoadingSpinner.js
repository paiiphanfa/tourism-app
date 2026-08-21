import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../theme/theme";

export default function LoadingSpinner({ style }) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator color={colors.teal} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
