// =======================
// CONFIG
// =======================
const SUPABASE_URL = "https://ttottijljxoinptmhgtu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0b3R0aWpsanhvaW5wdG1oZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTYxODQsImV4cCI6MjA3MzU5MjE4NH0.XnIf3xLzSbZDwFVKWjLTCiF4jnnDMQ1W95EI-v6F-3Y";

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// =======================
// STATE
// =======================
let cartTotal = 0;
let monthlyRemain = 0;

// =======================
// INIT
// =======================
init();

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    document.body.innerHTML = "กรุณา Login ผ่าน LIFF";
    return;
  }

  // โหลด summary
  const res = await fetch("/functions/v1/get-member-summary", {
    headers: { Authorization: `Bearer ${user.access_token}` }
  });
  const summary = await res.json();

  document.getElementById("memberName").innerText =
    summary.name;

  monthlyRemain = summary.remaining;
  document.getElementById("remain").innerText = monthlyRemain;
}

// =======================
// CART
// =======================
document.querySelectorAll("button[data-amount]").forEach(btn => {
  btn.onclick = () => {
    const amt = parseInt(btn.dataset.amount);
    if (cartTotal + amt > monthlyRemain) {
      alert("เกินวงเงินรายเดือน");
      return;
    }
    cartTotal += amt;
    document.getElementById("cartTotal").innerText = cartTotal;
  };
});

// =======================
// SUBMIT
// =======================
document.getElementById("submit").onclick = async () => {
  if (cartTotal === 0) {
    alert("กรุณาเลือกจำนวนหุ้น");
    return;
  }

  const file = document.getElementById("slip").files[0];
  if (!file) {
    alert("กรุณาแนบสลิป");
    return;
  }

  const { data: upload } = await supabase.storage
    .from("payment-slip")
    .upload(`tmp/${Date.now()}.jpg`, file);

  const { data: { user } } = await supabase.auth.getUser();

  const res = await fetch("/functions/v1/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.access_token}`
    },
    body: JSON.stringify({
      cartAmount: cartTotal,
      stockQty: cartTotal / 10,
      slipPath: upload.path,
      entryTime: new Date().toISOString()
    })
  });

  const json = await res.json();
  document.getElementById("msg").innerText =
    json.success ? "ส่งคำสั่งซื้อแล้ว รอตรวจสอบ" : json.error;
};
