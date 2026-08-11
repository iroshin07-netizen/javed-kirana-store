const API_URL = "https://script.google.com/macros/s/AKfycbyftLUtwa8XIIntZSqBaru3G0BFeA0lF5ltabbXHe8rvMY4wqf7X-vQJirLX0hrQeoMKA/exec";

// Enter your Telegram Bot Token and Chat ID below carefully
const TELEGRAM_BOT_TOKEN = "8938878280:AAHh_1LZyiU-nZyx_w4CmtEsfLhJ-04hI5U"; 
const TELEGRAM_CHAT_ID = "8513607592";

let cart = [];
let allFetchedProducts = [];
let currentCategory = 'All';

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedNotice = localStorage.getItem("javed_store_notice");
    const banner = document.getElementById('announcement-bar');
    const noticeText = document.getElementById('announcement-text');
    if (savedNotice && banner && noticeText) {
        noticeText.innerText = savedNotice;
        banner.classList.remove('hidden');
    }
    fetchProducts();
});

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        allFetchedProducts = await response.json();
        renderFilteredProducts();
    } catch (error) {
        console.error("Fetch Error:", error);
    }
}

function renderFilteredProducts() {
    const container = document.getElementById('product-container');
    if (!container) return;
    container.innerHTML = "";

    const filtered = allFetchedProducts.filter(product => {
        const name = product["Product"] || product["PRODUCT"] || "";
        const status = product["Status"] || "In stock";
        if (!name || status === "Out of stock") return false;
        if (currentCategory === 'All') return true;
        return (product["Category"] || "").toLowerCase() === currentCategory.toLowerCase();
    });

    if (filtered.length === 0) {
        container.innerHTML = "<p class='loading-text'>No items found in this category.</p>";
        return;
    }

    filtered.forEach(product => {
        const name = product["Product"] || product["PRODUCT"] || "";
        const price = product["Price"] || 0;
        const unit = product["Unit"] || "";
        const imageUrl = product["Image URL"] || "";

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="product-image">
            <h3 class="product-name">${name}</h3>
            <p class="product-unit">${unit}</p>
            <p class="product-price">₹${price}</p>
            <button class="add-btn" onclick="addToCart('${name}', ${price}, '${unit}')">ADD +</button>
        `;
        container.appendChild(card);
    });
}

function filterByCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.cat-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    renderFilteredProducts();
}

function addToCart(name, price, unit) {
    const existing = cart.find(item => item.name === name);
    if (existing) existing.quantity += 1;
    else cart.push({ name, price: Number(price), unit, quantity: 1 });
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalBill = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = totalItems;
    const fc = document.getElementById('floating-cart');
    if (totalItems > 0) {
        fc.classList.remove('hidden');
        document.getElementById('fc-count').innerText = `${totalItems} items`;
        document.getElementById('fc-total').innerText = `₹${totalBill}`;
    } else {
        fc.classList.add('hidden');
    }
}

// Modal handling
document.getElementById('cart-button')?.addEventListener('click', openCartModal);
document.getElementById('floating-cart')?.addEventListener('click', openCartModal);
document.getElementById('close-cart')?.addEventListener('click', () => document.getElementById('cart-modal').classList.add('hidden'));

function openCartModal() {
    document.getElementById('cart-modal').classList.remove('hidden');
    renderCartItems();
}

const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
const upiSection = document.getElementById('upi-section');
paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (upiSection) {
            upiSection.style.display = e.target.value === 'UPI' ? 'block' : 'none';
        }
    });
});

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('cart-total-price');
    const payAmountEl = document.getElementById('pay-amount');
    const upiLinkBtn = document.getElementById('upi-link-btn');

    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty!</p>';
        if (totalPriceEl) totalPriceEl.innerText = '₹0';
        if (payAmountEl) payAmountEl.innerText = '0';
        return;
    }

    container.innerHTML = '';
    let totalBill = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalBill += itemTotal;
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <div>
                    <h4 style="font-size: 0.9rem; color: #1e293b;">${item.name}</h4>
                    <p style="font-size: 0.75rem; color: #64748b;">${item.quantity} ${item.unit} x ₹${item.price}</p>
                </div>
                <div style="font-weight: 600; color: #059669; font-size: 0.95rem;">₹${itemTotal}</div>
            </div>
        `;
    });

    if (totalPriceEl) totalPriceEl.innerText = `₹${totalBill}`;
    if (payAmountEl) payAmountEl.innerText = totalBill;
    if (upiLinkBtn) {
        upiLinkBtn.href = `upi://pay?pa=javedbhai@upi&pn=Javed Kirana Store&am=${totalBill}&cu=INR`;
    }
}

document.getElementById('copy-upi-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText("javedbhai@upi").then(() => alert("UPI ID Copied!"));
});

// Order Placement & Telegram Integration
document.getElementById('place-order-btn')?.addEventListener('click', async () => {
    if (cart.length === 0) { alert("Cart is empty!"); return; }

    const name = document.getElementById('cust-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    const address = document.getElementById('cust-address')?.value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const photoInput = document.getElementById('payment-proof');

    if (!name || !phone || !address) { alert("Please fill name, phone and address!"); return; }
    if (paymentMethod === 'UPI' && (!photoInput || photoInput.files.length === 0)) {
        alert("Please upload payment screenshot!"); return;
    }

    const orderBtn = document.getElementById('place-order-btn');
    if (orderBtn) { orderBtn.innerText = "Sending Order..."; orderBtn.disabled = true; }

    const orderId = "#" + Math.floor(100 + Math.random() * 900);
    const orderDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    const totalBill = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let itemsText = "";
    cart.forEach(item => { itemsText += `${item.quantity} ${item.unit} ${item.name}\n`; });

    const captionMsg = `NEW ORDER RECEIVED\n\nDate: ${orderDate}\nOrder ID: ${orderId}\nAmount: ₹${totalBill}\nPayment Mode: ${paymentMethod}\nCustomer: ${name}\nPhone: ${phone}\nDelivery Address: ${address}\n\nItems List:\n${itemsText}`;

    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    formData.append("parse_mode", "Markdown");

    let telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/`;
    if (paymentMethod === 'UPI') {
        formData.append("photo", photoInput.files[0]);
        formData.append("caption", captionMsg);
        telegramUrl += "sendPhoto";
    } else {
        formData.append("text", captionMsg);
        telegramUrl += "sendMessage";
    }

    try {
        const response = await fetch(telegramUrl, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.ok) {
            alert(`Success! Order ${orderId} placed.`);
            cart = [];
            updateCartUI();
            document.getElementById('cart-modal')?.classList.add('hidden');
        } else {
            console.error("Telegram API Error Details:", result);
            alert("Failed to send order. Error: " + (result.description || "Unknown error"));
        }
    } catch (err) {
        console.error("Network Error:", err);
        alert("Network error occurred. Please check your connection.");
    } finally {
        if (orderBtn) { orderBtn.innerText = "Place Order"; orderBtn.disabled = false; }
    }
});
