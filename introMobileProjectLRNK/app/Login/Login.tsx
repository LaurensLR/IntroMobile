import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from '@/app/firebase/firebaseConfig';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from '../firebase/firebaseConfig';
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
      router.replace("/home");
    } catch (error) {
      Alert.alert("Fout", "Gebruikersnaam of wachtwoord is onjuist.");
      console.log(error);
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
      router.replace("/home");
    } catch (error) {
      Alert.alert("Fout", "Gebruikersnaam is al in gebruik of het wachtwoord is te zwak.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welkom bij Playtomic</Text>
          <TextInput
              value={username}
              placeholder="Gebruikersnaam"
              autoCapitalize="none"
              onChangeText={setUsername}
              style={styles.input}
          />
          <TextInput
              value={password}
              placeholder="Wachtwoord"
              secureTextEntry={true}
              autoCapitalize="none"
              onChangeText={setPassword}
              style={styles.input}
          />
          {loading ? (
              <ActivityIndicator size="large" color="#345fff" />
          ) : (
              <>
                <Pressable onPress={signIn} style={styles.loginBtn}>
                  <Text style={styles.btnText}>Inloggen</Text>
                </Pressable>
                <Pressable onPress={signUp} style={styles.registerBtn}>
                  <Text style={styles.btnText}>Registreren</Text>
                </Pressable>
              </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "#345fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: "#345fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  registerBtn: {
    backgroundColor: "#cbff00",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Login;