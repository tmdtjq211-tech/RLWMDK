// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = { 
    apiKey: "AIzaSyCvf7uhsBqZtz6iC-xzxDngnLEsZJGIot0", 
    authDomain: "gameih.firebaseapp.com", 
    databaseURL: "https://gameih-default-rtdb.firebaseio.com", 
    projectId: "gameih", 
    storageBucket: "gameih.firebasestorage.app", 
    messagingSenderId: "898099533818", 
    appId: "1:898099533818:web:a5e683940c9b9524c5b643" 
};

export const app = initializeApp(firebaseConfig); 
export const auth = getAuth(app); 
export const db = getDatabase(app); 
export const provider = new GoogleAuthProvider();
