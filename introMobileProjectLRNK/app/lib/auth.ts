import { getAuth } from "firebase/auth";

export const getUserId = () => {
    const user = getAuth().currentUser;
    return user?.uid || null;
};

export const getCurrentUser = () => {
    return getAuth().currentUser;
};