import { Tabs } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';

const RootLayout = () => {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="community" 
        options={{ 
          title: 'Community',
          tabBarIcon: ({ color }) => <FontAwesome name="users" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profiel',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}

export default RootLayout;