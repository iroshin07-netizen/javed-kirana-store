const API_URL = "https://script.google.com/macros/s/AKfycbyftLUtwa8XIIntZSqBaru3G0BFeA0lF5ltabbXHe8rvMY4wqf7X-vQJirLX0hrQeoMKA/exec";
const TELEGRAM_BOT_TOKEN = "8938878280:AAHh_1LZyiU-nZyx_w4CmtEsfLhJ-04hI5U"; 
const TELEGRAM_CHAT_ID = "8513607592";
const STORE_UPI_ID = "javedbhai@upi"; // Update this with Javed bhai's actual UPI ID later

let cart = [];
let allFetchedProducts = [];
let currentCategory = 'All';

window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }
    }, 1800);

    const savedNotice = localStorage.getItem("javed_store_notice");
    if (savedNotice) {
        const noticeEl = document.getElementById('announcement-text');
        const bannerEl = document.getElementById('announcement-bar');
        if(noticeEl && bannerEl) {
            noticeEl.innerText = savedNotice;
            bannerEl.classList.remove('hidden');
        }
    }
    fetchProducts();
});

async function fetchProducts() {
    try {
        const response = await fetch(API_URL);
        allFetchedProducts = await response.json();
        renderProducts();
    } catch (e) {
        console.error("Error loading products:", e);
        const container = document.getElementById('product-container');
        if(container) container.innerHTML = "<p class='loading-text'>Failed to load items.</p>";
    }
}

function renderProducts() {
    const container = document.getElementById('product-container');
    if (!container) return;
    container.innerHTML = "";

    const filtered = allFetchedProducts.filter(p => {
        const status = p["Status"] || "In stock";
        if (status === "Out of stock") return false;
        return currentCategory === 'All' || (p.Category || "").toLowerCase() === currentCategory.toLowerCase();
    });

    if (filtered.length === 0) {
        container.innerHTML = "<p class='loading-text'>No items found.</p>";
        return;
    }

    filtered.forEach(p => {
        const name = p.Product || p.PRODUCT || "Item";
        const price = p.Price || 0;
        const unit = p.Unit || "";
        const image = p['Image URL'] || "";

        container.innerHTML += `
            <div class="product-card">
                <img src="${image}" alt="${name}" class="product-image">
                <h3 class="product-name">${name}</h3>
                <p class="product-unit">${unit}</p>
                <p class="product-price">₹${price}</p>
                <button class="add-btn" onclick="addToCart('${name}', ${price}, '${unit}')">ADD +</button>
            </div>
        `;
    });
}

function filterByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderProducts();
}

function addToCart(name, price, unit) {
    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ name, price: Number(price), unit, quantity: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    const totalBill = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    document.getElementById('cart-count').innerText = totalItems;
    document.getElementById('fc-count').innerText = `${totalItems} items`;
    document.getElementById('fc-total').innerText = `₹${totalBill}`;
    
    const fc = document.getElementById('floating-cart');
    if(fc) {
        if(totalItems > 0) fc.classList.remove('hidden');
        else fc.classList.add('hidden');
    }

    // Update dynamic UPI payment link with the exact total bill amount
    const upiPayBtn = document.getElementById('upi-pay-btn');
    if (upiPayBtn) {
        upiPayBtn.href = `upi://pay?pa=${STORE_UPI_ID}&pn=Javed%20Kirana%20Store&am=${totalBill}&cu=INR`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cart-button')?.addEventListener('click', openCartModal);
    document.getElementById('floating-cart')?.addEventListener('click', openCartModal);
    document.getElementById('close-cart')?.addEventListener('click', () => {
        document.getElementById('cart-modal')?.classList.add('hidden');
    });
});

function openCartModal() {
    const modal = document.getElementById('cart-modal');
    const container = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('cart-total-price');
    
    if(!modal || !container) return;
    
    let totalBill = 0;
    if(cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty!</p>';
        if(totalPriceEl) totalPriceEl.innerText = '₹0';
    } else {
        container.innerHTML = '';
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalBill += itemTotal;
            container.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                    <div>
                        <h4 style="font-size: 0.85rem; color: #1e293b;">${item.name}</h4>
                        <p style="font-size: 0.7rem; color: #64748b;">${item.quantity} ${item.unit} x ₹${item.price}</p>
                    </div>
                    <div style="font-weight: 600; color: #059669; font-size: 0.95rem;">₹${itemTotal}</div>
                </div>
            `;
        });
        if(totalPriceEl) totalPriceEl.innerText = `₹${totalBill}`;
    }
    
    // Update UPI Link inside modal
    const upiPayBtn = document.getElementById('upi-pay-btn');
    if (upiPayBtn) {
        upiPayBtn.href = `upi://pay?pa=${STORE_UPI_ID}&pn=Javed%20Kirana%20Store&am=${totalBill}&cu=INR`;
    }

    modal.classList.remove('hidden');
}

// Toggle UPI section visibility based on selected payment method
function toggleUpiSection() {
    const selectedMethod = document.querySelector('input[name="pay-method"]:checked').value;
    const upiSection = document.getElementById('upi-section');
    if (selectedMethod === 'Pay via UPI') {
        upiSection.classList.remove('hidden');
    } else {
        upiSection.classList.add('hidden');
    }
}

// Order placement handler with support for UPI screenshot upload
document.getElementById('place-order-btn')?.addEventListener('click', async () => {
    if(cart.length === 0) { alert("Cart is empty!"); return; }
    
    const name = document.getElementById('cust-name')?.value.trim();
    const phone = document.getElementById('cust-phone')?.value.trim();
    const address = document.getElementById('cust-address')?.value.trim();
    const payMethod = document.querySelector('input[name="pay-method"]:checked').value;
    const screenshotInput = document.getElementById('payment-screenshot');
    
    if(!name || !phone || !address) { alert("Please fill name, phone and address/pickup info!"); return; }
    
    if(payMethod === 'Pay via UPI' && screenshotInput.files.length === 0) {
        alert("Please upload payment screenshot for UPI payment!");
        return;
    }

    const orderBtn = document.getElementById('place-order-btn');
    if(orderBtn) { orderBtn.innerText = "Sending Order..."; orderBtn.disabled = true; }

    let itemsText = cart.map(i => `${i.quantity} ${i.unit} ${i.name}`).join('\n');
    const totalBill = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const msg = `🟢 NEW ORDER RECEIVED\n\nMode: ${payMethod}\nCustomer: ${name}\nPhone: ${phone}\nAddress/Pickup: ${address}\nTotal: ₹${totalBill}\n\nItems:\n${itemsText}`;

    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    formData.append("caption", msg);

    let telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/`;

    try {
        if (payMethod === 'Pay via UPI' && screenshotInput.files.length > 0) {
            formData.append("photo", screenshotInput.files[0]);
            telegramApiUrl += "sendPhoto";
        } else {
            formData.append("text", msg);
            telegramApiUrl += "sendMessage";
            formData.delete("caption");
        }

        const res = await fetch(telegramApiUrl, {
            method: 'POST',
            body: formData
        });
        const result = await res.json();

        if(result.ok) {
            alert("Order Placed Successfully!");
            cart = [];
            updateCartUI();
            document.getElementById('cart-modal')?.classList.add('hidden');
        } else {
            alert("Failed to send order: " + (result.description || "Unknown error"));
        }
    } catch(e) {
        alert("Network error occurred while sending order.");
    } finally {
        if(orderBtn) { orderBtn.innerText = "Place Order"; orderBtn.disabled = false; }
    }
});
                                                                                                         
