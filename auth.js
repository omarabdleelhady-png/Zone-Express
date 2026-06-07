import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// تسجيل الدخول
export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    if (!userDoc.exists()) throw new Error("المستخدم غير موجود في قاعدة البيانات");
    const userData = userDoc.data();
    localStorage.setItem("sf_role", userData.role);
    localStorage.setItem("sf_name", userData.name);
    localStorage.setItem("sf_uid", cred.user.uid);
    return userData;
  } catch (e) {
    throw new Error(getArabicError(e.code));
  }
}

// تسجيل الخروج
export async function logout() {
  localStorage.clear();
  await signOut(auth);
  window.location.href = "index.html";
}

// الحصول على الدور الحالي
export function getCurrentRole() {
  return localStorage.getItem("sf_role");
}

export function getCurrentUID() {
  return localStorage.getItem("sf_uid");
}

export function getCurrentName() {
  return localStorage.getItem("sf_name");
}

// حماية الصفحات
export function requireAuth(allowedRoles = []) {
  const role = getCurrentRole();
  const uid = getCurrentUID();
  if (!uid || !role) {
    window.location.href = "index.html";
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    alert("ليس لديك صلاحية للوصول لهذه الصفحة");
    const r = data.role; window.location.href = r === 'client' ? 'my-orders.html' : 'dashboard.html';
    return false;
  }
  return true;
}

// تحقق من الجلسة عند تحميل أي صفحة
export function checkSession(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        localStorage.setItem("sf_role", data.role);
        localStorage.setItem("sf_name", data.name);
        localStorage.setItem("sf_uid", user.uid);
        callback(data);
      } else {
        logout();
      }
    } else {
      if (!window.location.href.includes("index.html")) {
        window.location.href = "index.html";
      }
    }
  });
}

function getArabicError(code) {
  const errors = {
    "auth/user-not-found": "البريد الإلكتروني غير مسجل",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-email": "البريد الإلكتروني غير صالح",
    "auth/too-many-requests": "تم تجاوز عدد المحاولات، حاول لاحقاً",
    "auth/network-request-failed": "تحقق من اتصالك بالإنترنت"
  };
  return errors[code] || "حدث خطأ، حاول مرة أخرى";
}
