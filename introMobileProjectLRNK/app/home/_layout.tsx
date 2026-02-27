import { Stack } from 'expo-router';

const HomeLayout = () => {
    return (
        <Stack
            screenOptions={{
                headerTitle: "MyAppName",
                headerTitleAlign: "center",
                headerStyle: {
                    backgroundColor: "#111",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                    fontSize: 20,
                },
            }}
        />
    );
}

export default HomeLayout;