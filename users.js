import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, doc, setDoc, getDocs, updateDoc,
  query, where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getCurrentUID } from "./auth.js";

// إضافة مستخدم جديد (مدير فقط)
export async function addEmployee(name, email, password, role) {
  const validRoles = ["admin", "accountant", "callcenter", "courier", "client"];
  if (!validRoles.includes(role)) throw new Error("دور غير صالح");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    role,
    status: "active",
    createdBy: getCurrentUID(),
    createdAt: new Date().toISOString(),
  });

  if (role === "courier") {
    await setDoc(doc(db, "couriers", cred.user.uid), {
      name,
      email,
      phone: "",
      uid: cred.user.uid,
      status: "active",
      totalDelivered: 0,
      totalFailed: 0,
      createdAt: new Date().toISOString(),
    });
  }

  return cred.user.uid;
}

// جلب كل المناديب
export async function getCouriers() {
  const snap = await getDocs(
    query(collection(db, "couriers"), where("status", "==", "active"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// جلب كل الموظفين (realtime)
export function listenEmployees(callback) {
  return onSnapshot(
    query(collection(db, "users"), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// تحديث حالة موظف
export async function toggleEmployeeStatus(uid, newStatus) {
  await updateDoc(doc(db, "users", uid), { status: newStatus });
}

// أسماء الأدوار بالعربي
export const roleLabels = {
  admin: "مدير",
  accountant: "محاسب",
  callcenter: "كول سنتر",
  courier: "مندوب",
  client: "عميل",
};

export const roleColors = {
  admin: "purple",
  accountant: "blue",
  callcenter: "amber",
  courier: "green",
  client: "blue",
};
