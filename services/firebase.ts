import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA7PKLdPOXLSe1tWl6KJHXS1gX-rVPNKv4",
    authDomain: "poster-template.firebaseapp.com",
    projectId: "poster-template",
    storageBucket: "poster-template.firebasestorage.app",
    messagingSenderId: "1020471959548",
    appId: "1:1020471959548:web:d96269de88fb7658c4dc79",
    measurementId: "G-Y4XDC6RZMP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence (cache)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore persistence failed-precondition:', err.message);
    } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Firestore persistence unimplemented:', err.message);
    }
});

export { db };