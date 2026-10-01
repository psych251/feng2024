// Entry point for `npm run bundle:firebase`. esbuild turns this into lib/firebase-bundle.js,
// a single classic script that exposes window.firebaseBundle. Only the functions listed here
// are included; add more if src/save.js needs them, then re-run the bundle script.
export { initializeApp } from "firebase/app";
export { getAuth, signInAnonymously, connectAuthEmulator } from "firebase/auth";
export {
  getFirestore,
  doc,
  collection,
  setDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  connectFirestoreEmulator,
} from "firebase/firestore";
