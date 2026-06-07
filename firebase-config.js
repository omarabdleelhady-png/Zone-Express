// ==========================================
// ضع هنا بيانات Firebase project الخاص بك
// من Firebase Console > Project Settings > Your apps
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAJmC-fnsiVH4m19jPXQjooVm_h9_DaOD0",
  authDomain: "zone-express-be478.firebaseapp.com",
  projectId: "zone-express-be478",
  storageBucket: "zone-express-be478.firebasestorage.app",
  messagingSenderId: "683926080338",
  appId: "1:683926080338:web:bc2da5af17b3e3675c488b",
  measurementId: "G-M7BCC27444"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
