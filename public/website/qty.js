
document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.product-card').forEach(card => {

        const minus = card.querySelector('.qty-minus');
        const plus = card.querySelector('.qty-plus');
        const qtyInput = card.querySelector('.qty-input');
        const totalPrice = card.querySelector('.total-price');
        const buyBtn = card.querySelector('.buy-now');

        if (!minus || !plus || !qtyInput || !totalPrice || !buyBtn) {
            return;
        }

        const price = Number(buyBtn.dataset.price);
        const stock = Number(qtyInput.dataset.stock);

        // Decrement
        minus.addEventListener('click', function () {

            let qty = Number(qtyInput.value);

            if (qty > 1) {
                qty--;
            }

            qtyInput.value = qty;
            totalPrice.innerText = (price * qty).toFixed(2);

        });

        // Increment with Stock Limit
        plus.addEventListener('click', function () {

            let qty = Number(qtyInput.value);

            if (qty < stock) {
                qty++;
                qtyInput.value = qty;
                totalPrice.innerText = (price * qty).toFixed(2);
            } else {
                
            }

        });

        // Buy Now - Dynamic Payment Route
        buyBtn.addEventListener('click', function () {

            const qty = Number(qtyInput.value);
            const paymentUrl = buyBtn.dataset.url;

            const sizeSelect = card.querySelector('.product-size');
            const selectedSize = sizeSelect ? sizeSelect.value : '';
            const selectedColor = card.dataset.selectedColor || '';

            if (!selectedSize) {
                alert('Please select product size');
                return;
            }
                  
            window.location.href =
    `${paymentUrl}?qty=${qty}&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}`;
        });

    });

});


document.querySelectorAll('.product-card').forEach(function(card) {

    var color_buttons = card.querySelectorAll('.color-option');
    var color_name = card.querySelector('.color-name');

    color_buttons.forEach(function(button) {

        button.addEventListener('click', function() {

            // Remove previous selected colour
            color_buttons.forEach(function(btn) {
                btn.style.background = '';
                btn.style.color = '';
                btn.style.border = '1px solid #ccc';
            });

            // Select clicked colour
            button.style.background = '#222';
            button.style.color = '#fff';
            button.style.border = '1px solid #222';

            // Show selected colour
            color_name.innerText = button.dataset.color;

            // Store selected colour in product card
            card.dataset.selectedColor = button.dataset.color;

        });

    });

});



// all_product_payment
