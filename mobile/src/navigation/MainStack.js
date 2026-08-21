import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import TripsListScreen from "../screens/TripsListScreen";
import NewTripScreen from "../screens/NewTripScreen";
import ItineraryScreen from "../screens/ItineraryScreen";
import ChatScreen from "../screens/ChatScreen";
import { colors, fonts } from "../theme/theme";

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTitleStyle: { fontFamily: fonts.displaySemiBold, color: colors.ink, fontSize: 18 },
  headerTintColor: colors.teal,
};

export default function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Trips" screenOptions={headerOptions}>
      <Stack.Screen
        name="Trips"
        component={TripsListScreen}
        options={({ navigation }) => ({
          title: "My Trips",
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate("NewTrip")} hitSlop={10}>
              <Ionicons name="add-circle" size={28} color={colors.teal} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="NewTrip" component={NewTripScreen} options={{ title: "Plan a trip" }} />
      <Stack.Screen name="Itinerary" component={ItineraryScreen} options={{ title: "Your itinerary" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Trip chat" }} />
    </Stack.Navigator>
  );
}
