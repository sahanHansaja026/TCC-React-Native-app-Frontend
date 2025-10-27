import { SafeAreaView, StyleSheet, View, Text, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import React, { useCallback, useState } from "react";
import axios from 'axios';
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native"; // 👈 added
import API_BASE_URL from '../../config/ipconfig';
import authService from "../services/authService";
import Headersvg from "../../assets/cars/modernhedder.svg";
import AddVechiclesIcon from "../../assets/images/add vechicals.png";
import CarIconIcon from "../../assets/cars/caricon.png";

export default function Carselect({ navigation }) {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 👇 Function to fetch vehicles
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await authService.getUserData();
      setUser(userData);

      const response = await axios.get(`${API_BASE_URL}/get_vehicle/${userData.email}`);
      setVehicles(response.data);
    } catch (error) {
      console.error("Error fetching user data or vehicles:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 👇 This runs every time the screen comes into focus (auto refresh)
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.maincontainer}>
      {/* Fixed AppBar/Header */}
      <View style={styles.imagecontainer}>
        <Headersvg style={styles.image} />
        <Text style={styles.title}>Add or Manage Vehicles</Text>
      </View>

      {/* Scrollable List below the AppBar */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <FlatList
          data={vehicles}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item }) => (
            <View style={styles.vehicleCard}>
              <View style={styles.caritems}>
                <Image source={CarIconIcon} style={styles.addIcon} />
                <View style={styles.cartext}>
                  <Text style={styles.normaltextbold}>{item.model}</Text>
                  <Text style={styles.normaltext}>{item.licenseplate}</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, marginTop: 170 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Add Vehicle Button fixed at bottom */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(components)/addnewcar")}
        >
          <Image source={AddVechiclesIcon} style={styles.addIcon} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  maincontainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  imagecontainer: {
    width: "100%",
    height: 150,
    backgroundColor: "#FFFD78",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  title: {
    position: "absolute",
    color: "#000",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
  container: { flex: 1, padding: 16, backgroundColor: '#FFFD78' },
  vehicleCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFFD78',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FFFD78",
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  addIcon: {
    width: 60,
    height: 60,
  },
  caritems: {
    flexDirection: 'row',
    padding: 5,
    alignItems: 'center',
    gap: 25,
  },
  cartext: {
    flexDirection: 'column',
  },
  normaltext: {
    fontSize: 20,
  },
  normaltextbold: {
    fontSize: 25,
    fontWeight: 'bold',
  },
});
