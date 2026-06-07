import { db, storage } from "./firebase-config.js";
import {
  collection, addDoc, updateDoc, doc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getCurrentUID, getCurrentName } from "./auth.js";

// توليد كود 9 أرقام فريد
export function generateOrderCode() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

// إضافة أوردر جديد (المدير فقط)
export async function addOrder(orderData) {
  const code = generateOrderCode();
  const order = {
    code,
    clientName: orderData.clientName,
    clientPhone: orderData.clientPhone,
    clientAddress: orderData.clientAddress,
    productName: orderData.productName,
    quantity: orderData.quantity,
    productPrice: Number(orderData.productPrice),
    shippingPrice: Number(orderData.shippingPrice),
    productCost: Number(orderData.productCost),
    profit: Number(orderData.productPrice) + Number(orderData.shippingPrice) - Number(orderData.productCost),
    // Flow: pending_confirmation → confirmed → assigned → delivering → delivered / failed
    status: "pending_confirmation",
    callCenterNote: "",
    courierId: null,
    courierName: null,
    deliveryProofUrl: null,
    failureLocation: null,
    failureNote: "",
    createdBy: getCurrentUID(),
    createdByName: getCurrentName(),
    createdAt: serverTimestamp(),
    confirmedAt: null,
    assignedAt: null,
    deliveredAt: null,
  };
  const docRef = await addDoc(collection(db, "orders"), order);
  return { id: docRef.id, ...order };
}

// كول سنتر: تأكيد الأوردر
export async function confirmOrder(orderId, confirmed, note = "") {
  const status = confirmed ? "confirmed" : "pending_client";
  await updateDoc(doc(db, "orders", orderId), {
    status,
    callCenterNote: note,
    callCenterUID: getCurrentUID(),
    callCenterName: getCurrentName(),
    confirmedAt: serverTimestamp(),
  });
}

// مدير: تعيين مندوب
export async function assignCourier(orderId, courierId, courierName) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "assigned",
    courierId,
    courierName,
    assignedAt: serverTimestamp(),
    assignedBy: getCurrentUID(),
  });
}

// مندوب: بدء التوصيل
export async function startDelivery(orderId) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "delivering",
    deliveryStartedAt: serverTimestamp(),
  });
}

// مندوب: رفع صورة التسليم الناجح
export async function uploadDeliveryProof(orderId, imageFile) {
  const storageRef = ref(storage, `delivery-proofs/${orderId}_${Date.now()}.jpg`);
  await uploadBytes(storageRef, imageFile);
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, "orders", orderId), {
    status: "delivered",
    deliveryProofUrl: url,
    deliveredAt: serverTimestamp(),
  });
  return url;
}

// مندوب: تسجيل فشل التسليم مع GPS
export async function reportDeliveryFailure(orderId, note) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("الجهاز لا يدعم GPS"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
          mapsLink: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        };
        await updateDoc(doc(db, "orders", orderId), {
          status: "failed",
          failureNote: note,
          failureLocation: location,
          failedAt: serverTimestamp(),
          failedBy: getCurrentUID(),
          failedByName: getCurrentName(),
        });
        resolve(location);
      },
      (err) => reject(new Error("تعذر الحصول على الموقع، تأكد من تفعيل GPS")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// جلب الطلبات حسب الدور (realtime)
export function listenOrders(role, uid, callback) {
  let q;
  if (role === "admin") {
    q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  } else if (role === "callcenter") {
    q = query(
      collection(db, "orders"),
      where("status", "in", ["pending_confirmation", "pending_client", "confirmed"]),
      orderBy("createdAt", "desc")
    );
  } else if (role === "courier") {
    q = query(
      collection(db, "orders"),
      where("courierId", "==", uid),
      orderBy("createdAt", "desc")
    );
  } else if (role === "accountant") {
    q = query(
      collection(db, "orders"),
      where("status", "in", ["delivered", "failed"]),
      orderBy("createdAt", "desc")
    );
  }
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

// جلب الطلبات المؤكدة للتعيين (مدير)
export function listenConfirmedOrders(callback) {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "confirmed"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// حساب الأرباح
export async function getProfitReport(period = "monthly") {
  const now = new Date();
  let startDate;
  if (period === "weekly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const q = query(
    collection(db, "orders"),
    where("status", "==", "delivered"),
    where("deliveredAt", ">=", startDate)
  );
  const snap = await getDocs(q);
  const orders = snap.docs.map(d => d.data());

  return {
    totalOrders: orders.length,
    totalSales: orders.reduce((s, o) => s + (o.productPrice || 0), 0),
    totalShipping: orders.reduce((s, o) => s + (o.shippingPrice || 0), 0),
    totalCost: orders.reduce((s, o) => s + (o.productCost || 0), 0),
    totalProfit: orders.reduce((s, o) => s + (o.profit || 0), 0),
    orders,
  };
}
