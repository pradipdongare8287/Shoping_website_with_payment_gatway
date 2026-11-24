const express = require('express');
const website = express();
const util = require('util');
const cookie = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');
var query = require('../database');
const admin = require('./admin');

const Razorpay = require('razorpay');



var key = 'users';

website.use(express.urlencoded({ extended: true }));
website.use(express.json());

website.use(express.static('public'));

website.use(cookie());

website.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: false
}));

// ====================Check Use login ===================================

function Check_User_Login(req, res, next) {

    var token = req.cookies.User;

    if (!token) {
        return res.redirect('/login?message=login_first');
    }

    try {
        var verify_user = jwt.verify(token, key);

        req.user = verify_user;

        next();

    } catch (error) {
        res.clearCookie('User');
        return res.redirect('/login?message=login_first');
    }
}

// ================= JWT COOKIE MIDDLEWARE =================

website.use((req, res, next) => {
    var token = req.cookies.User;
    if (token) {
        try {
            var decoded = jwt.verify(token, key);
            req.user = decoded;
            res.locals.uid = decoded.uid;
            res.locals.useremail = decoded.useremail;
        } catch (err) {
            res.clearCookie('User');
            res.locals.uid = null;
            res.locals.useremail = null;
        }
    } else {
        res.locals.uid = null;
        res.locals.useremail = null;
    }
    next();
});


// ================= HOME =================

website.get('/', async (req, res) => {

    

     var Other_products = 'select * from add_product';

    var product = await query(Other_products);

    res.render('website/all_products.ejs', {
        product: product
    });

});


// ================= LOGIN =================

website.get('/login', (req, res) => {

    res.render('website/login_page.ejs');

});


// ================= LOGIN CHECK =================

website.post('/login_check', async (req, res) => {
    var { email, password } = req.body;
    var find_user = `select * from users where user_email = ? and user_password = ?`;
    var user = await query(find_user, [email, password]);
    if (user[0]) {
        var userid = user[0].Uid;
        var useremail = user[0].user_email;
        var token = jwt.sign({uid: userid,useremail: useremail},key,{expiresIn: '30d'});
        // Store JWT Token in Cookie
        res.cookie('User', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: false
        });
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});
// ================= TRENDING PRODUCT PAYMENT =================

website.get('/trending_product_payemnt/:id', Check_User_Login, async (req, res) => {

    var id = req.params.id;

    // URL madhun quantity ghe
    var qty = Number(req.query.qty) || 1;

    if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).send('Invalid quantity');
    }

    var size = req.query.size;

    var color = req.query.color;

    
    if (!size) {
        return res.status(400).send('Please select product size');
    }

    var trending_product = `
        SELECT *
        FROM trending_products
        WHERE tpid = ?
    `;

    var product = await query(trending_product, [id]);

    if (!product || product.length === 0) {
        return res.status(404).send('Product not found');
    }

    var price = Number(product[0].TProduct_new_price);
    var total_amount = price * qty;

    res.render('website/order_confirm.ejs', {
        payment_amt: {
            Product_New_price: total_amount,
            Product_name: product[0].TProduct_name
        },
        product_id: product[0].tpid,
        product_name: product[0].TProduct_name,
        product_img: product[0].TProduct_image,
        product_folder: 'ecommerce/trending_products',
        product_type: 'trending',
        qty: qty,
        unit_price: price,
        size: size,
        color: color
    });

});



// ================= ALL PRODUCTS =================

website.get('/all_products', async (req, res) => {

    var trending_product = 'select * from trending_products';
    var select_category_product = 'select * from category_product'

    var product = await query(trending_product);
    var categrory_product = await query(select_category_product);


    res.render('website/home.ejs', {
        product: product,categrory_product:categrory_product
    });

});


// ================= ALL PRODUCT PAYMENT =================

website.get('/all_product_payment/:id', Check_User_Login, async (req, res) => {

    var id = req.params.id;

    // URL madhun quantity ghe
    var qty = Number(req.query.qty) || 1;

    if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).send('Invalid quantity');
    }

    var size = req.query.size;

    var color = req.query.color;


    if (!size) {
        return res.status(400).send('Please select product size');
    }

    var all_proudct = 'select * from add_product where Pid = ?';

    var product = await query(all_proudct, [id]);

    if (!product || product.length === 0) {
        return res.status(404).send('Product not found');
    }

    var price = Number(product[0].Product_New_price);
    var total_amount = price * qty;

    res.render('website/order_confirm.ejs', {

        payment_amt: {
            Product_New_price: total_amount,
            Product_name: product[0].Product_name
        },

        product_id: product[0].Pid,
        product_name: product[0].Product_name,
        product_img: product[0].Product_img,
        product_folder: 'ecommerce/products',
        product_type: 'all_product',

        qty: qty,
        unit_price: price,
        size: size,
        color:color

    });

});



// ================= FASHION =================

website.get('/fashion', async (req, res) => {

    var fashion_product = 'select * from fashion_product';

    var fashion = await query(fashion_product);

    res.render('website/fashion.ejs', {
        fashion: fashion
    });

});


// ================= FASHION PAYMENT =================



website.get('/fashion_product_paymnet/:id', Check_User_Login, async (req, res) => {

    var id = req.params.id;

    // URL madhun quantity ghe
    var qty = Number(req.query.qty) || 1;

    if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).send('Invalid quantity');
    }

    var size = req.query.size;
    var color = req.query.color;

    

    if (!size) {
        return res.status(400).send('Please select product size');
    }

    var purchase_product = `
        SELECT *,
        fashion_product_new_price AS Product_New_price
        FROM fashion_product
        WHERE fid = ?
    `;

    var product = await query(purchase_product, [id]);

    if (!product || product.length === 0) {
        return res.status(404).send('Product not found');
    }

    var price = Number(product[0].fashion_product_new_price);
    var total_amount = price * qty;

    res.render('website/order_confirm.ejs', {

        payment_amt: {
            Product_New_price: total_amount,
            Product_name: product[0].fashion_product_name
        },

        product_id: product[0].fid,
        product_name: product[0].fashion_product_name,
        product_img: product[0].fashion_product_img,
        product_folder: 'ecommerce/fashion_products',
        product_type: 'fashion',

        qty: qty,
        unit_price: price,
        size:size,
        color:color

    });

});



// ================= ELECTRONICS =================

website.get('/electronics', async (req, res) => {

    var products = 'select * from electronics_products';

    var all_products = await query(products);

    res.render('website/electronics.ejs', {
        all_products: all_products    
    });

});


// ================= ELECTRONICS PAYMENT =================



website.get('/Pyment_electnocis_product/:id', Check_User_Login, async (req, res) => {

    var id = req.params.id;

    // URL madhun quantity ghe
    var qty = Number(req.query.qty) || 1;

    if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).send('Invalid quantity');
    }

    var size = req.query.size;
    var color = req.query.color;
    



    if (!size) {
        return res.status(400).send('Please select product size');
    }

    var select_purchase_product = `
        SELECT *,
        Eproduct_new_price AS Product_New_price
        FROM electronics_products
        WHERE Eid = ?
    `;

    var product = await query(select_purchase_product, [id]);

    if (!product || product.length === 0) {
        return res.status(404).send('Product not found');
    }

    var price = Number(product[0].Eproduct_new_price);
    var total_amount = price * qty;

    res.render('website/order_confirm.ejs', {

        payment_amt: {
            Product_New_price: total_amount,
            Product_name: product[0].Eproduct_name
        },

        product_id: product[0].Eid,
        product_name: product[0].Eproduct_name,
        product_img: product[0].Eprodcut_img,
        product_folder: 'ecommerce/electronics_products',
        product_type: 'electronics',

        qty: qty,
        unit_price: price,
        size:size,
        color:color

    });

});


// ================= BEAUTY =================

website.get('/beauty', async (req, res) => {

    var beauty_product = 'select * from beauty_product';

    var beauty = await query(beauty_product);

    res.render('website/beauty.ejs', {
        beauty: beauty
    });

});

// ============check out=============================
website.get('/checkout', Check_User_Login, (req, res) => {
    res.render('website/checkout.ejs');
});

website.get('/order_success', Check_User_Login, (req, res) => {
    res.render('website/order_success.ejs');
});
 
// ================= BEAUTY PAYMENT =================


website.get('/payment_beauyt_product/:id', Check_User_Login, async (req, res) => {

    var id = req.params.id;

    // URL madhun quantity ghe
    var qty = Number(req.query.qty) || 1;

    if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).send('Invalid quantity');
    }

     var size = req.query.size;
     var color = req.query.color;
    

    var select_product = `
        SELECT *,
        product_new_price AS Product_New_price
        FROM beauty_product
        WHERE pid = ?
    `;

    var product = await query(select_product, [id]);

    if (!product || product.length === 0) {
        return res.status(404).send('Product not found');
    }

    var price = Number(product[0].product_new_price);
    var total_amount = price * qty;

    res.render('website/order_confirm.ejs', {

        payment_amt: {
            Product_New_price: total_amount,
            Product_name: product[0].product_name
        },

        product_id: product[0].pid,
        product_name: product[0].product_name,
        product_img: product[0].Prdouct_image,
        product_folder: 'ecommerce/beauty_products',
        	product_type: 'beauty',

        qty: qty,
        unit_price: price,
        size:size,
        color:color

    });

});


// ================= Save Order =================

// website.post('/save_order', async (req, res) => {

//     if (!req.user) {
//         return res.status(401).json({
//             success: false,
//             message: 'Please login first'
//         });
//     }

//     var {
//         product_id,
//         product_name,
//         product_price,
//         product_qty,
//         payment_id,
//         product_img,
//         product_size,
//         product_folder
//     } = req.body;

//     var qty = Number(product_qty);

//     if (!Number.isInteger(qty) || qty < 1) {
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid quantity'
//         });
//     }

//     var save_order = `
//         INSERT INTO orders
//         (
//             Uid,
//             Product_id,
//             Product_name,
//             Product_price,
//             Product_qty,
//             Payment_id,
//             Order_date,
//             Order_status,
//             Payment_status,
//             Product_image,
//             Product_size,
//             Product_folder
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, 'Booked', 'Paid', ?,?,?)
//     `;

//     let now = new Date();

//     let Order_date = now.getFullYear() + "-" +
//         String(now.getMonth() + 1).padStart(2, '0') + "-" +
//         String(now.getDate()).padStart(2, '0') + " " +
//         String(now.getHours()).padStart(2, '0') + ":" +
//         String(now.getMinutes()).padStart(2, '0') + ":" +
//         String(now.getSeconds()).padStart(2, '0');

//     await query(save_order, [
//         req.user.uid,
//         product_id,
//         product_name,
//         product_price,
//         qty,
//         payment_id,
//         Order_date,
//         product_img,
//         product_size,
//         product_folder
//     ]);

//     res.json({
//         success: true
//     });

// });


website.post('/save_order', async (req, res) => {

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Please login first'
        });
    }

    var {
        product_id,
        product_name,
        product_price,
        product_qty,
        payment_id,
        product_img,
        product_size,
        product_folder,
        product_type,
        product_color
    } = req.body;

    var qty = Number(product_qty);

    if (!Number.isInteger(qty) || qty < 1 || !payment_id) {
        return res.status(400).json({
            success: false,
            message: 'Invalid quantity or payment ID'
        });
    }

    // Product Type nusar table select karne
    var product_tables = {
        all_product: {
            table: 'add_product',
            id: 'Pid'
        },
        trending: {
            table: 'trending_products',
            id: 'tpid'
        },
        fashion: {
            table: 'fashion_product',
            id: 'fid'
        },
        electronics: {
            table: 'electronics_products',
            id: 'Eid'
        },
        beauty: {
            table: 'beauty_product',
            id: 'pid'
        }
    };

    var selected_product = product_tables[product_type];

    if (!selected_product) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product type'
        });
    }

    var connection;

    try {
        

        connection = await query.getConnection();

        var dbQuery = async (sql, values = []) => {
                var [result] = await connection.query(sql, values);
                return result;
            };

        await connection.beginTransaction();
       
        // Stock kami karne
        var update_stock = `
            UPDATE ${selected_product.table}
            SET Product_stock = Product_stock - ?
            WHERE ${selected_product.id} = ?
            AND Product_stock >= ?
        `;

        var stock_result = await dbQuery(update_stock, [
            qty,
            product_id,
            qty
        ]);

        if (stock_result.affectedRows === 0) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Insufficient stock. Product is not available.'
            });
        }



        // Order save karne
        var save_order = `
            INSERT INTO orders
            (
                Uid,
                Product_id,
                Product_name,
                Product_price,
                Product_qty,
                Payment_id,
                Order_date,
                Order_status,
                Payment_status,
                Product_image,
                Product_size,
                Product_folder,
                Product_color
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Booked', 'UNPAID', ?, ?, ?,?)
        `;

        var now = new Date();

        var Order_date = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, '0') + "-" +
            String(now.getDate()).padStart(2, '0') + " " +
            String(now.getHours()).padStart(2, '0') + ":" +
            String(now.getMinutes()).padStart(2, '0') + ":" +
            String(now.getSeconds()).padStart(2, '0');

        await dbQuery(save_order, [
            req.user.uid,
            product_id,
            product_name,
            product_price,
            qty,
            payment_id,
            Order_date,
            product_img,
            product_size,
            product_folder,
            product_color
        ]);

        await connection.commit();

        return res.json({
            success: true
        });

    } catch (error) {

        console.log('Save Order Error:', error);

        if (connection) {
    try {
        await connection.rollback();
    } catch (rollbackError) {
        console.log('Rollback Error:', rollbackError);
    }
}

        return res.status(500).json({
            success: false,
            message: 'Order could not be saved'
        });

    } finally {

        if (connection) {
            
        }

    }

});




website.post('/save_cart_order', Check_User_Login, async (req, res) => {

    var connection;

    try {

        var uid = req.user.uid;

        connection = await query.getConnection();

        var dbQuery = async (sql, values = []) => {
            var [result] = await connection.query(sql, values);
            return result;
        };

        await connection.beginTransaction();

        // User che Cart Products
       var cart_items = await dbQuery(
            `SELECT
                MIN(Cart_id) AS Cart_id,
                Uid,
                Product_id,
                Product_type,
                Product_size,
                SUM(Product_qty) AS Product_qty,
                MAX(Product_price) AS Product_price
            FROM cart_order
            WHERE Uid = ?
            GROUP BY
                Uid,
                Product_id,
                Product_type,
                Product_size`,
            [uid]
        );


        var grand_total = 0;

        cart_items.forEach(function(item) {
            grand_total += Number(item.Product_price) * Number(item.Product_qty);
        });

        console.log("Cart Grand Total:", grand_total);


        if (cart_items.length === 0) {
            await connection.rollback();

            return res.json({
                success: false,
                message: 'Your cart is empty'
            });
        }

        // Product tables mapping
        var product_tables = {
            all_product: {
                table: 'add_product',
                id: 'Pid',
                name: 'Product_name',
                price: 'Product_New_price',
                image: 'Product_img',
                folder: 'products'
            },
            trending: {
                table: 'trending_products',
                id: 'tpid',
                name: 'TProduct_name',
                price: 'TProduct_new_price',
                image: 'TProduct_image',
                folder: 'trending_products'
            },
            fashion: {
                table: 'fashion_product',
                id: 'fid',
                name: 'fashion_product_name',
                price: 'fashion_product_new_price',
                image: 'fashion_product_img',
                folder: 'fashion_products'
            },
            electronics: {
                table: 'electronics_products',
                id: 'Eid',
                name: 'Eproduct_name',
                price: 'Eproduct_new_price',
                image: 'Eprodcut_img',
                folder: 'electronics_products'
            },
            beauty: {
                table: 'beauty_product',
                id: 'pid',
                name: 'product_name',
                price: 'product_new_price',
                image: 'Prdouct_image',
                folder: 'beauty_products'
            }
        };

        var order_group_id = require('crypto').randomUUID();

        var now = new Date();

        var Order_date = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, '0') + "-" +
            String(now.getDate()).padStart(2, '0') + " " +
            String(now.getHours()).padStart(2, '0') + ":" +
            String(now.getMinutes()).padStart(2, '0') + ":" +
            String(now.getSeconds()).padStart(2, '0');

        // Each Cart Product Process
        for (var i = 0; i < cart_items.length; i++) {

            var item = cart_items[i];

            var selected_product = product_tables[item.Product_type];

            if (!selected_product) {
                throw new Error('Invalid product type');
            }

            var product_data = await dbQuery(`
                SELECT
                    ${selected_product.name} AS Product_name,
                    ${selected_product.price} AS Product_price,
                    Product_stock,
                    ${selected_product.image} AS Product_image
                FROM ${selected_product.table}
                WHERE ${selected_product.id} = ?
                FOR UPDATE
            `, [item.Product_id]);

            if (product_data.length === 0) {
                throw new Error('Product not found');
            }

            var product = product_data[0];

            var qty = Number(item.Product_qty);

            console.log("STOCK CHECK:", {
    Product_id: item.Product_id,
    Product_type: item.Product_type,
    Product_name: product.Product_name,
    Available_stock: product.Product_stock,
    Cart_quantity: qty
});

          
            

            if (!Number.isInteger(qty) || qty < 1) {
                throw new Error('Invalid product quantity');
            }

            var order_qty = Math.min(
                qty,
                Number(product.Product_stock)
            );

            if (order_qty < qty) {
                console.log('Partial Stock Order:', product.Product_name);
            }

            if (order_qty <= 0) {
                continue;
            }

            // Stock Update
            var stock_result = await dbQuery(`
                UPDATE ${selected_product.table}
                SET Product_stock = Product_stock - ?
                WHERE ${selected_product.id} = ?
                AND Product_stock >= ?
            `,[order_qty, item.Product_id, order_qty]);

            if (stock_result.affectedRows === 0) {
                throw new Error('Insufficient stock: ' + product.Product_name);
            }

            // Save Cart Order
            await dbQuery(`
                INSERT INTO purchase_cart_orders
                (
                    Order_Group_ID,
                    Uid,
                    Product_id,
                    Product_type,
                    Product_name,
                    Product_price,
                    Product_qty,
                    Product_size,
                    Product_image,
                    Order_date,
                    Order_status,
                    Payment_status,
                    Payment_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booked', 'Pending', 'UNPAID')
            `, [
                order_group_id,
                uid,
                item.Product_id,
                item.Product_type,
                product.Product_name,
                product.Product_price,
                order_qty,
                item.Product_size,
                product.Product_image,
                Order_date
            ]);

        }

        // Cart Clear
        await dbQuery(
            `DELETE FROM cart_order WHERE Uid = ?`,
            [uid]
        );

                    await connection.commit();

            return res.redirect('/order_success');

    } catch (error) {

        console.log('Cart Order Error:', error);

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.log(rollbackError);
            }
        }

        return res.json({
            success: false,
            message: error.message || 'Cart Order Failed'
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }

});



// ================= HOME AND LIVING =================

website.get('/home_and_leaving', async (req, res) => {

    var home_product = 'select * from home_products';

    var products = await query(home_product);

    res.render('website/home_and_leaving.ejs', {
        products: products
    });

});

// website.get('/edit_profile',async(req,res)=>{
//     var id = req.user.uid;
//     var find_user = 'select * from users where Uid =?'
//     var select_user = await query(find_user,[id])
//     res.render('website/update_user.ejs',{user:select_user})
// })


// ================= CONTACT =================wishlist
website.get('/contact',async(req, res) => {
    var contacs = 'select * from contact_option'
    var all_contact = await query(contacs)

    res.render('website/contact.ejs',{contact:all_contact});

});


// ================= ACCOUNT =================

website.get('/account', async (req, res) => {


    var user_id = req.user.uid;

    var getuser = 'SELECT * FROM users WHERE Uid = ?';
    var user = await query(getuser, [user_id]);

    // console.log("Login User ID:", user_id);
// console.log("Database User Result:", user);

    var total_orders = `SELECT COUNT(*) AS Total_Orders FROM orders WHERE Uid = ?;`
    var all_orders = await query(total_orders,[user_id])

    var getorders = 'SELECT * FROM orders WHERE Uid = ? ORDER BY Order_date DESC';
    var orders = await query(getorders, [user_id]);

    // Cart मधून केलेले Orders
var get_cart_orders = `
    SELECT * FROM purchase_cart_orders
    WHERE Uid = ?
    ORDER BY Order_date DESC
`;

var cart_orders = await query(get_cart_orders, [user_id]);

    // console.log(orders)
    // console.log('Account User:', user[0]);
    res.render('website/account.ejs', {
        user: user[0],
        orders: orders,
        all_orders:all_orders[0],
        cart_orders: cart_orders
    });

});
website.get('/cart', Check_User_Login, async (req, res) => {

    var uid = req.user.uid;

    var cart_data = `
        SELECT 
            c.Cart_id,
            c.Uid,
            c.Product_id,
            c.Product_type,
            c.Product_qty,
            c.Product_size,
            c.Product_price,
            p.Product_name,
            p.Product_img
        FROM cart_order c
        LEFT JOIN (
            SELECT 
                Pid AS Product_id,
                'all_product' AS Product_type,
                Product_name,
                Product_img
            FROM add_product

            UNION ALL

            SELECT 
                tpid AS Product_id,
                'trending' AS Product_type,
                TProduct_name AS Product_name,
                TProduct_image AS Product_img
            FROM trending_products

            UNION ALL

            SELECT 
                fid AS Product_id,
                'fashion' AS Product_type,
                fashion_product_name AS Product_name,
                fashion_product_img AS Product_img
            FROM fashion_product

            UNION ALL

            SELECT 
                Eid AS Product_id,
                'electronics' AS Product_type,
                Eproduct_name AS Product_name,
                Eprodcut_img AS Product_img
            FROM electronics_products

            UNION ALL

            SELECT 
                pid AS Product_id,
                'beauty' AS Product_type,
                product_name AS Product_name,
                Prdouct_image AS Product_img
            FROM beauty_product

        ) p
        ON c.Product_id = p.Product_id
        AND c.Product_type = p.Product_type

        WHERE c.Uid = ?
    `;

    var cart = await query(cart_data, [uid]);

    res.render('website/cart.ejs', {
        uid: uid,
        cart: cart
    });

});

 
website.post('/add_to_cart', Check_User_Login, async (req, res) => {

    try {

        var product_tables = {
    all_product: {
        table: 'add_product',
        id: 'Pid',
        price: 'Product_New_price',
        stock: 'Product_stock',
        size: 'Product_size'
    },

    trending: {
        table: 'trending_products',
        id: 'tpid',
        price: 'TProduct_new_price',
        stock: 'Product_stock',
        size: 'Product_size'
    },

    fashion: {
        table: 'fashion_product',
        id: 'fid',
        price: 'fashion_product_new_price',
        stock: 'Product_stock',
        size: 'Product_size'
    },

    electronics: {
        table: 'electronics_products',
        id: 'Eid',
        price: 'Eproduct_new_price',
        stock: 'Product_stock',
        size: 'Product_size'
    },

    beauty: {
        table: 'beauty_product',
        id: 'pid',
        price: 'product_new_price',
        stock: 'Product_stock',
        size: 'Product_size'
    }
};

        var uid = req.user.uid;
        var product_id = req.body.product_id;
        var product_type = req.body.product_type;
        var qty = parseInt(req.body.qty);
        var size = req.body.size;

        if (!product_id || !size || !qty || qty < 1) {
            return res.json({
                success: false,
                message: 'Please select size and quantity'
            });
        }

        // All Products मधून product माहिती
// Product Type Check
var selected_table = product_tables[product_type];

if (!selected_table) {
    return res.json({
        success: false,
        message: 'Invalid product type'
    });
}

// Selected Section मधून Product माहिती
var product_data = `
    SELECT 
        ${selected_table.id} AS Product_id,
        ${selected_table.price} AS Product_New_price,
        ${selected_table.stock} AS Product_stock,
        ${selected_table.size} AS Product_size
    FROM ${selected_table.table}
    WHERE ${selected_table.id} = ?
`;

var product = await query(product_data, [product_id]);

        if (product.length === 0) {
            return res.json({
                success: false,
                message: 'Product not found'
            });
        }

        var selected_product = product[0];

        if (qty > selected_product.Product_stock) {
            return res.json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        var sizes = [];

        try {
            sizes = JSON.parse(selected_product.Product_size || '[]');
        } catch (e) {
            sizes = [];
        }

        if (!sizes.includes(size)) {
            return res.json({
                success: false,
                message: 'Invalid product size'
            });
        }

        // आधीपासून Cart मध्ये आहे का?
        var check_cart = `
            SELECT * FROM cart_order
            WHERE Uid = ?
            AND Product_id = ?
            AND Product_type = ?
            AND Product_size = ?
        `;

        var existing = await query(check_cart, [
            uid, product_id, product_type, size
        ]);

        if (existing.length > 0) {

            var new_qty = existing[0].Product_qty + qty;

            if (new_qty > selected_product.Product_stock) {
                return res.json({
                    success: false,
                    message: 'Insufficient stock'
                });
            }

            await query(
                `UPDATE cart_order SET Product_qty = ? WHERE Cart_id = ?`,
                [new_qty, existing[0].Cart_id]
            );

        } else {

            await query(`
                INSERT INTO cart_order
                (Uid, Product_id, Product_type, Product_qty, Product_size, Product_price)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                uid,
                product_id,
                product_type,
                qty,
                size,
                selected_product.Product_New_price
            ]);

        }

        res.json({
            success: true,
            // message: 'Product added to cart successfully!'
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: 'Something went wrong'
        });

    }

});

website.get('/delete_cart_item/:cart_id', Check_User_Login, async (req, res) => {

    try {

        var uid = req.user.uid;
        var cart_id = req.params.cart_id;

        await query(
            'DELETE FROM cart_order WHERE Cart_id = ? AND Uid = ?',
            [cart_id, uid]
        );

        res.redirect('/cart');

    } catch (error) {

        console.log('Delete Cart Item Error:', error);
        res.redirect('/cart');

    }

});

// ================= LOGOUT =================

website.get('/logout', (req, res) => {

    // Clear JWT Cookie

    res.clearCookie('User');

    // Destroy Session

    req.session.destroy((err) => {

        res.redirect('/');

    });

});


// ================= WISHLIST =================

website.get('/wishlist', (req, res) => {

    res.render('website/wishlist.ejs');

});


website.get('/registration',(req,res)=>{
        res.render('website/register_user.ejs',{warning:''})
})

website.post('/save_user',async(req,res)=>{
    var {user_name,user_email,user_password,user_mobile,user_address,user_account_status} = req.body

    var find_copy_user = 'select * from users where user_email=?'
    var exist_user = await query(find_copy_user,[user_email])

    if(exist_user.length>0){
        res.render('website/register_user.ejs',{warning:'Please Enter Other Email This Email Is Used'})
    }
    else{
        var save_new_user = 'insert into users (user_email,user_password,user_mobile,user_account_status,user_address,user_name) values(?,?,?,?,?,?)'
        var save = await query(save_new_user,[user_email,user_password,user_mobile,user_account_status,user_address,user_name])
        res.redirect('/login')
    }
    
})

website.post('/contact_save',async(req,res)=>{
    var {Customer_name,Customer_email,Customer_subject,Customer_message} = req.body
    var contact = 'insert into users_contact_message (Customer_name,Customer_email,Customer_subject,Customer_message,Message_status) values(?,?,?,?,?)'
    var save_contact = await query(contact,[Customer_name,Customer_email,Customer_subject,Customer_message,'Pending'])
    res.redirect('/contact')
})
module.exports = website;