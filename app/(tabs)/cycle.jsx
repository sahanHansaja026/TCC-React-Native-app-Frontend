import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import API_BASE_URL from "../../config/ipconfig";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export default function Appcycle() {
  const router = useRouter();
  const webviewRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearestParking, setNearestParking] = useState("Finding nearest parking...");
  const [nearestParkingData, setNearestParkingData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // ✅ Haversine Distance Formula
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // ✅ Fetch parking lot data from API
  const fetchParkingLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_parking_locations`);
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching parking locations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Detect nearest parking to user
  const getNearestParking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setNearestParking("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      let nearest = null;
      let nearestDistance = Infinity;

      locations.forEach(lot => {
        const dist = getDistance(latitude, longitude, lot.lat, lot.lng);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearest = lot;
        }
      });

      if (nearest) {
        setNearestParking(`${nearest.lotname} (${nearestDistance.toFixed(2)} km away)`);
        setNearestParkingData(nearest);
      }
    } catch (error) {
      setNearestParking("Error fetching location");
    }
  };

  useEffect(() => {
    fetchParkingLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0) getNearestParking();
  }, [locations]);

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="initial-scale=1.0">
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map').setView([7.8731, 80.7718], 8);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const parkingIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/1072/1072562.png',
        iconSize: [30, 30],
      });

      const userIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Blue_dot.png',
        iconSize: [20, 20],
      });

      const locations = ${JSON.stringify(locations)};

      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], { icon: parkingIcon }).addTo(map);
        marker.bindPopup('<b>${"Parking Lot"}:</b> ' + loc.lotname);

        marker.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "lotSelected",
            lotId: loc.parkinglotid,
            lotName: loc.lotname
          }));
        });
      });

      document.addEventListener("message", function(event) {
        const data = JSON.parse(event.data);

        if (data.type === "showUser") {
          L.marker([data.lat, data.lng], { icon: userIcon }).addTo(map)
            .bindPopup("📍 You are here").openPopup();
        }

        if (data.type === "zoomToParking") {
          map.setView([data.lat, data.lng], 17, { animate: true });
        }
      });
    </script>
  </body>
  </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.map}
        onLoadEnd={() => {
          if (userLocation) {
            webviewRef.current?.postMessage(JSON.stringify({
              type: "showUser",
              lat: userLocation.latitude,
              lng: userLocation.longitude
            }));
          }
        }}
        onMessage={(event) => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === "lotSelected") {
            router.push({ pathname: "/(components)/owner", params: { id: data.lotId } });
          }
        }}
      />

      <View style={styles.bottomBox}>
        <TouchableOpacity
          style={styles.yellowBar}
          onPress={() => {
            if (nearestParkingData) {
              webviewRef.current?.postMessage(JSON.stringify({
                type: "zoomToParking",
                lat: nearestParkingData.lat,
                lng: nearestParkingData.lng
              }));
            }
          }}>
          <Ionicons name="location-sharp" size={22} color="#4a4a4a" />
          <Text style={styles.yellowText}>{nearestParking}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  bottomBox: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },
  yellowBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFC35",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 5,
  },
  yellowText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  }
});
