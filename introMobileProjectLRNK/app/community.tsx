import { useState } from "react";
import { Text, View, StyleSheet, Pressable, FlatList } from "react-native";

const Community = () => {
  const [activeTab, setActiveTab] = useState("feed");

  const feedData = [
    { id: "1", text: "Nieuwe wedstrijd gespeeld door Tom" },
    { id: "2", text: "Veld 3 is weer beschikbaar" },
    { id: "3", text: "Toernooi inschrijvingen open!" },
  ];

  const groepenData = [
    { id: "1", text: "Zondag Ochtend Padel" },
    { id: "2", text: "Local Tennis Club" },
    { id: "3", text: "Beginners Groep" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable 
          style={({ pressed }) => [styles.tab, activeTab === "feed" && styles.activeTab, pressed && { opacity: 0.7 }]} 
          onPress={() => setActiveTab("feed")}
        >
          <Text style={activeTab === "feed" ? styles.activeText : styles.text}>Feed</Text>
        </Pressable>
        
        <Pressable 
          style={({ pressed }) => [styles.tab, activeTab === "groepen" && styles.activeTab, pressed && { opacity: 0.7 }]} 
          onPress={() => setActiveTab("groepen")}
        >
          <Text style={activeTab === "groepen" ? styles.activeText : styles.text}>Groepen</Text>
        </Pressable>
      </View>

      <View style={styles.listContainer}>
        {activeTab === "feed" ? (
          <FlatList
            data={feedData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text>{item.text}</Text>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={groepenData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text>{item.text}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "blue",
  },
  text: {
    color: "#555",
  },
  activeText: {
    color: "blue",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
    padding: 10,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  }
});

export default Community;