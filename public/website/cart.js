
    function animateCart(button) {

    var cartIcon = document.getElementById('header-cart-icon');

    if (!cartIcon) return;

    var bag = document.createElement('div');

    bag.innerHTML = '<i class="fa-solid fa-bag-shopping"></i>';

    bag.style.position = 'fixed';
    bag.style.zIndex = '99999';
    bag.style.fontSize = '22px';
    bag.style.color = '#ff6600';
    bag.style.pointerEvents = 'none';

    var buttonRect = button.getBoundingClientRect();
    var cartRect = cartIcon.getBoundingClientRect();

    bag.style.left = (buttonRect.left + buttonRect.width / 2) + 'px';
    bag.style.top = (buttonRect.top + buttonRect.height / 2) + 'px';

    document.body.appendChild(bag);

    var animation = bag.animate([
        {
            transform: 'translate(0, 0) scale(1)',
            opacity: 1
        },
        {
            transform: `translate(
                ${cartRect.left - buttonRect.left}px,
                ${cartRect.top - buttonRect.top}px
            ) scale(0.2)`,
            opacity: 0
        }
    ], {
        duration: 750,
        easing: 'ease-in',
        fill: 'forwards'
    });

    animation.onfinish = function() {
        bag.remove();
        cartIcon.style.transform = 'scale(1.2)';

        setTimeout(function() {
            cartIcon.style.transform = 'scale(1)';
        }, 200);
    };
}





document.querySelectorAll('.add-to-cart').forEach(function(button) {

    button.addEventListener('click', async function() {

        var card = button.closest('.product-card');

        var product_id = button.dataset.id;
        var product_type = button.dataset.type;
        var size = card.querySelector('.product-size').value;
        var qty = parseInt(card.querySelector('.qty-input').value);

        if (!size) {
            alert('Please select product size');
            return;
        }

        try {

            var response = await fetch('/add_to_cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: product_id,
                    product_type: product_type,
                    size: size,
                    qty: qty
                })
            });

            var result = await response.json();

            if (result.success) {
                animateCart(button);
            }

        } catch (error) {

            console.log(error);
            alert('Please Login First Before Shoping');

        }

    });

});