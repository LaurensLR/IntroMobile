import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH } from "@/app/firebase/firebaseConfig";
import { useEffect, useState } from "react";

export default function Index() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
}
interface CustomButtonProps {
    onPress: () => void;
    imageSource: ImageSourcePropType;
    label?: string;
}

const CustomButton = ({ onPress, imageSource, label }: CustomButtonProps) => {
    return (
        
            <View style={styles.ButtonContainer}>
            
            <Pressable
                style={({ pressed }) => [
                    styles.circle, { opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={onPress}
            >
                {imageSource && <Image source={imageSource} style={styles.buttonImage} />}
            </Pressable>
            {label && <Text style={styles.buttonText}>{label}</Text>}
        </View>
    );
 }

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoaded, setAuthLoaded] = useState(false);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) return null;

    if (!user) {
        return <Redirect href="/Login/Login" />;
    }

    return <Redirect href="/home" />;
}