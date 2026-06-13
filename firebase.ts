// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSyWaLtKXa9qve42c3L9sAZ7Mw0KuMdR8",
  authDomain: "samssweet.firebaseapp.com",
  projectId: "samssweet",
  storageBucket: "samssweet.firebasestorage.app",
  messagingSenderId: "962904517776",
  appId: "1:962904517776:web:da9f6e0a5a3fcbbcea3c15",
  measurementId: "G-698LHXPQC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);