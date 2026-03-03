import { Text, View, StyleSheet, Image } from "react-native";

const Profile = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: "https://via.placeholder.com/150" }} 
        style={styles.profilePic} 
      />
      <Text style={styles.name}>User Naam</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsLabel}>Aantal wedstrijden gespeeld:</Text>
        <Text style={styles.statsNumber}>42</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  statsContainer: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  statsLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "blue",
  }
});

export default Profile;