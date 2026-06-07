import { getCurrentRole, getCurrentName, logout } from "./auth.js";
import { roleLabels, roleColors } from "./users.js";

export function renderSidebar(activePage) {
  const role = getCurrentRole();
  const name = getCurrentName();

  const allNav = [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "لوحة التحكم", roles: ["admin","accountant","callcenter","courier","client"] },
    { id: "orders", icon: "ti-package", label: "الطلبات", roles: ["admin","callcenter","courier"] },
    { id: "my-orders", icon: "ti-package", label: "طلباتي", roles: ["client"] },
    { id: "add-order", icon: "ti-plus", label: "إضافة طلب", roles: ["admin","client"] },
    { id: "couriers", icon: "ti-moped", label: "المناديب", roles: ["admin"] },
    { id: "employees", icon: "ti-users", label: "الموظفون", roles: ["admin"] },
    { id: "accounting", icon: "ti-chart-bar", label: "المحاسبة", roles: ["admin","accountant"] },
  ];

  const visibleNav = allNav.filter(n => n.roles.includes(role));
  const badgeColor = roleColors[role] || "gray";
  const badgeLabel = roleLabels[role] || role;

  const html = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <i class="ti ti-truck-delivery"></i>
        Zone Express
      </div>
      <div class="nav-section">القائمة</div>
      ${visibleNav.map(n => `
        <a href="${n.id}.html" class="nav-item ${activePage === n.id ? 'active' : ''}">
          <i class="ti ${n.icon}"></i>
          ${n.label}
        </a>
      `).join('')}
      <div class="user-info">
        <div class="avatar" style="background:var(--primary-light);color:var(--primary)">
          ${name ? name.charAt(0) : 'م'}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name || 'مستخدم'}</div>
          <div class="badge ${badgeColor}" style="font-size:11px;padding:1px 7px;margin-top:2px">${badgeLabel}</div>
        </div>
        <button class="btn sm" onclick="doLogout()" title="خروج" style="border:none;padding:6px">
          <i class="ti ti-logout" style="color:var(--text-muted)"></i>
        </button>
      </div>
    </div>
    <div class="mobile-overlay" id="mobile-overlay" onclick="closeSidebar()"></div>
  `;

  document.body.insertAdjacentHTML("afterbegin", html);

  window.doLogout = async () => {
    if (confirm("هل تريد تسجيل الخروج؟")) await logout();
  };
  window.openSidebar = () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("mobile-overlay").classList.add("open");
  };
  window.closeSidebar = () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("mobile-overlay").classList.remove("open");
  };
}

// Toast notifications
export function toast(msg, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

export function openModal(id) { document.getElementById(id).classList.add("open"); }
export function closeModal(id) { document.getElementById(id).classList.remove("open"); }

export function formatDate(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const statusLabels = {
  pending_confirmation: { label: "بانتظار التأكيد", color: "amber" },
  pending_client:       { label: "العميل لم يرد", color: "red" },
  confirmed:            { label: "مؤكد", color: "blue" },
  assigned:             { label: "تم تعيين المندوب", color: "purple" },
  delivering:           { label: "جاري التوصيل", color: "amber" },
  delivered:            { label: "تم التسليم ✅", color: "green" },
  failed:               { label: "فشل التسليم", color: "red" },
};
