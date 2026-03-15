import { addDoc, collection } from "firebase/firestore";
import { FIRESTORE_DB } from "@/app/firebase/firebaseConfig";
import clubsData from "../../assets/clubs.json";

 async function seedClubs() {
    try {

        for (const club of clubsData.clubs) {
            const { fields, ...clubData } = club;
            const clubRef = await addDoc(
                collection(FIRESTORE_DB, "clubs"),
                clubData
            );
            console.log("Club created:", clubRef.id);
            for (const field of fields) {
                await addDoc(
                    collection(clubRef, "fields"),
                    field
                );
            }
        }

        console.log("Seeding finished");

    } catch (error) {
        console.error("Seeding error:", error);
    }
}

export const seeding = seedClubs;