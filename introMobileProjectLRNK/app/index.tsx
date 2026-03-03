import { Text, View, StyleSheet, Pressable } from "react-native";

const Index = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hallo, User Naam!</Text>
      
      <Pressable 
        style={({ pressed }) => [styles.customButton, pressed && { opacity: 0.7 }]} 
        onPress={() => {}}
      >
        <Text style={styles.buttonText}>Reserveer veld</Text>
      </Pressable>
      
      <Pressable 
        style={({ pressed }) => [styles.customButton, pressed && { opacity: 0.7 }]} 
        onPress={() => {}}
      >
        <Text style={styles.buttonText}>Maak wedstrijd</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#000000",
  },
  customButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  }
});

export default Index;