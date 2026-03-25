import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from '@/app/firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { router } from "expo-router";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = FIREBASE_AUTH;

  const signIn = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Fout", "Vul een gebruikersnaam en wachtwoord in.");
      return;
    }
    setLoading(true);
    try {
      const email = `${username.trim()}@lrnk.com`;
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Fout", "Gebruikersnaam of wachtwoord is onjuist.");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Fout", "Vul een gebruikersnaam en wachtwoord in.");
      return;
    }
    setLoading(true);
    try {
      const email = `${username.trim()}@lrnk.com`;
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(FIRESTORE_DB, "users", credential.user.uid), {
        username: username.trim(),
        sport: null,
        level: null,
      });

      router.replace("/(tabs)/users/Profile");
    } catch (error) {
      Alert.alert("Fout", "Gebruikersnaam is al in gebruik of wachtwoord te zwak.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* LOGO / TITLE */}
          <View style={styles.header}>
            <Text style={styles.logo}>PLAYTOMIC</Text>
            <Text style={styles.subtitle}>Vind en speel wedstrijden</Text>
          </View>

          {/* FORM */}
          <View style={styles.card}>
            <Text style={styles.label}>Gebruikersnaam</Text>
            <TextInput
                value={username}
                autoCapitalize="none"
                onChangeText={setUsername}
                style={styles.input}
                placeholderTextColor="#999"
            />

            <Text style={styles.label}>Wachtwoord</Text>
            <TextInput
                value={password}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#999"
            />

            {loading ? (
                <ActivityIndicator size="large" color="#345fff" style={{ marginTop: 20 }} />
            ) : (
                <>
                  <Pressable
                      onPress={signIn}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                  >
                    <Text style={styles.primaryText}>Inloggen</Text>
                  </Pressable>

                  <Pressable
                      onPress={signUp}
                      style={({ pressed }) => [
                        styles.secondaryBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                  >
                    <Text style={styles.secondaryText}>Account aanmaken</Text>
                  </Pressable>
                </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f8fc",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  header: {
    marginBottom: 40,
    alignItems: "center",
  },

  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#345fff",
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#f1f3f8",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 8,
  },

  primaryBtn: {
    backgroundColor: "#345fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#345fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  secondaryText: {
    color: "#345fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Login;