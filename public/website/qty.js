
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

            if (!selectedSize) {
                alert('Please select product size');
                return;
            }

            window.location.href =
                `${paymentUrl}?qty=${qty}&size=${encodeURIComponent(selectedSize)}`;

        });

    });

});



// all_product_payment
