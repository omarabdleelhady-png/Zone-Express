# 🚚 ShipFlow CRM - نظام إدارة شركة الشحن

## الملفات الموجودة

```
shipflow/
├── index.html          ← صفحة تسجيل الدخول
├── setup-admin.html    ← إعداد أول مدير (احذفه بعد الاستخدام!)
├── dashboard.html      ← لوحة التحكم
├── orders.html         ← الطلبات (مختلف حسب الدور)
├── add-order.html      ← إضافة طلب (مدير فقط)
├── employees.html      ← إدارة الموظفين (مدير فقط)
├── couriers.html       ← إدارة المناديب (مدير فقط)
├── accounting.html     ← تقارير الأرباح (مدير + محاسب)
├── firestore.rules     ← قواعد أمان Firestore
├── storage.rules       ← قواعد أمان Storage
├── css/
│   └── style.css
└── js/
    ├── firebase-config.js  ← ضع هنا بيانات Firebase
    ├── auth.js
    ├── orders.js
    ├── users.js
    └── ui.js
```

---

## خطوات الإعداد على Firebase

### 1. إنشاء المشروع
1. روح على https://console.firebase.google.com
2. اضغط **"Add project"**
3. ادخل اسم المشروع مثلاً: `shipflow-crm`
4. عطّل Google Analytics (مش محتاجه)
5. اضغط **"Create project"**

---

### 2. تفعيل Authentication
1. من القائمة الجانبية: **Build → Authentication**
2. اضغط **"Get started"**
3. اضغط على **"Email/Password"**
4. فعّل الأول (**Enable**) واضغط **Save**

---

### 3. إنشاء Firestore Database
1. من القائمة: **Build → Firestore Database**
2. اضغط **"Create database"**
3. اختر **"Start in test mode"** (هنغيرها بعدين)
4. اختر أقرب region (مثلاً `europe-west1` أو `us-central1`)
5. اضغط **"Done"**

---

### 4. تفعيل Storage
1. من القائمة: **Build → Storage**
2. اضغط **"Get started"**
3. اختر **"Start in test mode"**
4. اختر نفس الـ region واضغط **"Done"**

---

### 5. الحصول على بيانات الاتصال (Config)
1. من الصفحة الرئيسية للمشروع، اضغط أيقونة **`</>`** (Web app)
2. ادخل اسم مثل `shipflow-web` واضغط **"Register app"**
3. هتظهر بيانات مثل:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "shipflow-crm.firebaseapp.com",
  projectId: "shipflow-crm",
  storageBucket: "shipflow-crm.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```
4. افتح ملف `js/firebase-config.js` وحط البيانات دي مكان `YOUR_API_KEY` إلخ

---

### 6. تطبيق قواعد الأمان

#### Firestore Rules:
1. من **Firestore → Rules**
2. احذف الكلام الموجود والصق محتوى ملف `firestore.rules`
3. اضغط **"Publish"**

#### Storage Rules:
1. من **Storage → Rules**
2. احذف الكلام الموجود والصق محتوى ملف `storage.rules`
3. اضغط **"Publish"**

---

### 7. رفع الملفات على الاستضافة

#### الطريقة الأسهل: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# اختار المشروع بتاعك
# Public directory: . (نقطة)
# Single page app: No
firebase deploy
```

#### أو أي استضافة عادية (Shared Hosting):
- ارفع كل الملفات على سيرفرك عادي
- النظام شغال بـ HTML/JS مباشرة بدون backend

---

### 8. إنشاء أول حساب مدير
1. افتح `setup-admin.html` في المتصفح
2. ادخل اسمك، بريدك، كلمة مرور، واسم الشركة
3. اضغط **"إنشاء الحساب"**
4. **احذف ملف `setup-admin.html` من السيرفر فوراً بعد كده!**

---

## الأدوار والصلاحيات

| الصلاحية | مدير | محاسب | كول سنتر | مندوب |
|----------|------|-------|----------|-------|
| إضافة طلب | ✅ | ❌ | ❌ | ❌ |
| تأكيد طلب مع عميل | ❌ | ❌ | ✅ | ❌ |
| تعيين مندوب | ✅ | ❌ | ❌ | ❌ |
| بدء التوصيل | ❌ | ❌ | ❌ | ✅ |
| رفع صورة تسليم | ❌ | ❌ | ❌ | ✅ |
| تسجيل فشل + GPS | ❌ | ❌ | ❌ | ✅ |
| تقارير الأرباح | ✅ | ✅ | ❌ | ❌ |
| إضافة موظفين | ✅ | ❌ | ❌ | ❌ |

---

## Flow الطلب

```
مدير يضيف طلب
       ↓
[pending_confirmation] ← يظهر لكول سنتر
       ↓
كول سنتر يتصل بالعميل
   ↙          ↘
رد ✅         ما ردش ❌
[confirmed]   [pending_client] ← لحد ما يرد ويتأكد
   ↓
مدير يعين مندوب
[assigned] ← يظهر للمندوب
   ↓
مندوب يبدأ التوصيل
[delivering]
   ↙              ↘
تسليم ✅        مشكلة ❌
[delivered]     [failed]
صورة إثبات     GPS Location
```

---

## ملاحظات مهمة

- **GPS**: يشتغل على HTTPS فقط، لو رافعه على Firebase Hosting هيشتغل تلقائياً
- **صور التسليم**: بتتحفظ في Firebase Storage
- **Real-time**: كل الصفحات بتتحدث لحظياً بدون refresh
- **موبايل**: التصميم Responsive يشتغل على الموبايل كويس
