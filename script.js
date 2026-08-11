const API_URL = "https://script.google.com/macros/s/AKfycbyftLUtwa8XIIntZSqBaru3G0BFeA0lF5ltabbXHe8rvMY4wqf7X-vQJirLX0hrQeoMKA/exec";
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"; // Update this
const TELEGRAM_CHAT_ID = "8513607592";

let cart = [];
let allFetchedProducts = [];
let currentCategory = 'All';

window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
    }, 2000);
    
    const savedNotice = localStorage.getItem("javed_store_notice");
    if (savedNotice) {
        document.getElementById('announcement-text').innerText = savedNotice;
        document.getElementById('announcement-bar').classList.remove('hidden');
    }
    fetchProducts();
});

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        allFetchedProducts = await response.json();
        renderProducts();
    } catch (e) { console.error(e); }
}

function renderProducts() {
    const container = document.getElementById('product-container');
    container.innerHTML = "";
    allFetchedProducts.filter(p => currentCategory === 'All' || p.Category === currentCategory).forEach(p => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${p['Image URL']}" class="product-image">
                <h3 class="product-name">${p.Product}</h3>
                <p class="product-price">₹${p.Price}</p>
                <button class="add-btn" onclick="addToCart('${p.Product}', ${p.Price}, '${p.Unit}')">ADD +</button>
            </div>
        `;
    });
}

function addToCart(name, price, unit) {
    const item = cart.find(i => i.name === name);
    item ? item.quantity++ : cart.push({ name, price, quantity: 1 });
    updateCartUI();
}

function updateCartUI() {
    const total = cart.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-count').innerText = total;
    const fc = document.getElementById('floating-cart');
    total > 0 ? fc.classList.remove('hidden') : fc.classList.add('hidden');
}

document.getElementById('place-order-btn').addEventListener('click', async () => {
    const msg = `NEW ORDER\nCustomer: ${document.getElementById('cust-name').value}\nTotal: ₹${cart.reduce((s,i) => s+(i.price*i.quantity), 0)}`;
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg })
    });
    if((await res.json()).ok) alert("Order Placed!");
});
