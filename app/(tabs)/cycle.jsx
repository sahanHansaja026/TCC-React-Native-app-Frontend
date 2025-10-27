import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from "expo-router";
import axios from "axios";
import API_BASE_URL from '../../config/ipconfig';

export default function Appcycle() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParkingLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_parking_locations`);
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching parking locations:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingLocations();
    const interval = setInterval(() => {
      fetchParkingLocations();
      console.log("🔄 Refreshed parking lot data...");
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const locationsJS = JSON.stringify(locations);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0">
        <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
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
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          const locations = ${locationsJS};

          locations.forEach(function(loc) {
            const marker = L.marker([loc.lat, loc.lng], { icon: parkingIcon }).addTo(map);
            marker.bindPopup('<b>' + loc.lotname + '</b><br>' + loc.location);

            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "lotSelected",
                lotId: loc.parkinglotid,
                lotName: loc.lotname
              }));
            });
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "lotSelected") {
        console.log("Selected parking lot:", data.lotName, data.lotId);

        // ✅ Use router.push, not <Link>
        router.push(`/(components)/owner?parkinglotid=${data.lotId}&lotName=${encodeURIComponent(data.lotName)}`);
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
      />
      <View style={styles.bottomBox}>
        <TouchableOpacity style={styles.yellowbar} activeOpacity={0.7}>
          <View style={styles.paddingofyellobar}>
            <Text style={styles.yellowbartitles}>Select Your Parking Lot</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  bottomBox: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#FFFC35',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: 350,
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowbartitles: { color: '#000', fontSize: 26 },
  yellowbar: {
    width: 306,
    backgroundColor: '#fff',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});
