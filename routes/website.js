const express = require('express');
const website = express();

const cookie = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');

var query = require('../database');
const admin = require('./admin');

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

    var trending_product = 'select * from trending_products';
    var select_category_product = 'select * from category_product'

    var product = await query(trending_product);
    var categrory_product = await query(select_category_product);


    res.render('website/home.ejs', {
        product: product,categrory_product:categrory_product
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

website.get('/trending_product_payemnt/:id', async (req, res) => {

    var id = req.params.id;

    var trending_product = `
        SELECT *
        FROM trending_products
        WHERE tpid = ?
    `;

    var product = await query(trending_product, [id]);

    res.render('website/payment_page.ejs', {
        payment_amt: {
            Product_New_price: product[0].TProduct_new_price
        },
        product_id: product[0].tpid,
        product_name: product[0].TProduct_name
    });

});


// ================= ALL PRODUCTS =================

website.get('/all_products', async (req, res) => {

    var Other_products = 'select * from add_product';

    var product = await query(Other_products);

    res.render('website/all_products.ejs', {
        product: product
    });

});


// ================= ALL PRODUCT PAYMENT =================
website.get('/all_product_payment/:id', async (req, res) => {

    var id = req.params.id;

    var all_proudct = 'select * from add_product where Pid = ?';

    var product = await query(all_proudct, [id]);

    res.render('website/payment_page.ejs', { payment_amt: {Product_New_price: product[0].Product_New_price },product_id: product[0].Pid, product_name: product[0].Product_name});

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

website.get('/fashion_product_paymnet/:id', async (req, res) => {

    var id = req.params.id;

    var purchase_product = `
        select fashion_product_new_price as Product_New_price
        from fashion_product
        where fid = ?
    `;

    var product = await query(purchase_product, [id]);

    res.render('website/payment_page.ejs', {
        payment_amt: product[0]
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

website.get('/Pyment_electnocis_product/:id', async (req, res) => {

    var id = req.params.id;

    var select_purchase_product = `
        select Eproduct_new_price as Product_New_price
        from electronics_products
        where Eid = ?
    `;

    var payment_amt = await query(select_purchase_product, [id]);

    res.render('website/payment_page.ejs', {
        payment_amt: payment_amt[0]
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


// ================= BEAUTY PAYMENT =================

website.get('/payment_beauyt_product/:id', async (req, res) => {

    var id = req.params.id;

    var select_product = `
        select product_new_price as Product_New_price
        from beauty_product
        where pid = ?
    `;

    var payment_amt = await query(select_product, [id]);

    res.render('website/payment_page.ejs', {
        payment_amt: payment_amt[0]
    });

});

// ================= Save Order =================

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
        payment_id
    } = req.body;

    var save_order = `
        INSERT INTO orders
        (
            Uid,
            Product_id,
            Product_name,
            Product_price,
            Product_qty,
            Payment_id,
            Order_status,
            Payment_status
        )
        VALUES (?, ?, ?, ?, 1, ?, 'Placed', 'Paid')
    `;

    await query(save_order, [
        req.user.uid,
        product_id,
        product_name,
        product_price,
        payment_id
    ]);

    res.json({
        success: true
    });

});




// ================= HOME AND LIVING =================

website.get('/home_and_leaving', async (req, res) => {

    var home_product = 'select * from home_products';

    var products = await query(home_product);

    res.render('website/home_and_leaving.ejs', {
        products: products
    });

});


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

    var getorders = 'SELECT * FROM orders WHERE Uid = ? ORDER BY Order_date DESC';
    var orders = await query(getorders, [user_id]);

    res.render('website/account.ejs', {
        user: user[0],
        orders: orders
    });

});

// ================= CART =================
website.get('/cart', (req, res) => {
    res.render('website/cart.ejs');
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

website.post('/contact_save',async(req,res)=>{
    var {Customer_name,Customer_email,Customer_subject,Customer_message} = req.body
    var contact = 'insert into users_contact_message (Customer_name,Customer_email,Customer_subject,Customer_message,Message_status) values(?,?,?,?,?)'
    var save_contact = await query(contact,[Customer_name,Customer_email,Customer_subject,Customer_message,'Pending'])
    res.redirect('/contact')
})
module.exports = website;