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

website.get('/trending_product_payemnt/:id',Check_User_Login, async (req, res) => {

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
        product_name: product[0].TProduct_name,
        product_img : product[0].TProduct_image
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
website.get('/all_product_payment/:id',Check_User_Login, async (req, res) => {

    var id = req.params.id;

    var all_proudct = 'select * from add_product where Pid = ?';

    var product = await query(all_proudct, [id]);

    res.render('website/payment_page.ejs', { payment_amt: {Product_New_price: product[0].Product_New_price },
        product_id: product[0].Pid,
         product_name: product[0].Product_name,
         product_img:product[0].Product_img

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

website.get('/fashion_product_paymnet/:id', Check_User_Login,async (req, res) => {

    var id = req.params.id;

        var purchase_product = `
        SELECT *,
        fashion_product_new_price AS Product_New_price
        FROM fashion_product
        WHERE fid = ?
    `;

    var product = await query(purchase_product, [id]);

    res.render('website/payment_page.ejs', { payment_amt:{Product_New_price: product[0].fashion_product_new_price },
        product_id: product[0].fid, 
        product_name: product[0].fashion_product_name,
        product_img:product[0].fashion_product_img

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

website.get('/Pyment_electnocis_product/:id',Check_User_Login, async (req, res) => {

    var id = req.params.id;

  
     var select_purchase_product = `
        SELECT *,
        Eproduct_new_price AS Product_New_price
        FROM electronics_products
        WHERE Eid = ?
    `;

    var product = await query(select_purchase_product, [id]);

     res.render('website/payment_page.ejs', { payment_amt:{Product_New_price: product[0].Eproduct_new_price },
        product_id: product[0].Eid, 
        product_name: product[0].Eproduct_name,
        product_img:product[0].Eprodcut_img

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

website.get('/payment_beauyt_product/:id',Check_User_Login, async (req, res) => {

    var id = req.params.id;

     var select_product = `
        SELECT *,
        product_new_price AS Product_New_price
        FROM beauty_product
        WHERE pid = ?
    `;

    var product = await query(select_product, [id]);
        res.render('website/payment_page.ejs', { payment_amt:{Product_New_price: product[0].product_new_price },
        product_id: product[0].pid, 
        product_name: product[0].product_name,
        product_img:product[0].Prdouct_image

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
//         payment_id
//     } = req.body;

//     var save_order = `
//         INSERT INTO orders
//         (
//             Uid,
//             Product_id,
//             Product_name,
//             Product_price,
//             Product_qty,
//             Payment_id,
//             // Order_date,
//             Order_status,
//             Payment_status
//         )
//         VALUES (?, ?, ?, ?, 1, ?, 'Placed', 'Paid')
//     `;
//     let now = new Date();

//     let Order_date = now.toLocaleString('en-IN');

//     await query(save_order, [
//         req.user.uid,
//         product_id,
//         product_name,
//         product_price,
//         payment_id,
//         // Order_date
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
        payment_id,
        product_img
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
            Order_date,
            Order_status,
            Payment_status,
            Product_image
        )
        VALUES (?, ?, ?, ?, 1, ?, ?, 'Booked', 'Paid',?)
    `;

  let now = new Date();

let Order_date = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, '0') + "-" +
    String(now.getDate()).padStart(2, '0') + " " +
    String(now.getHours()).padStart(2, '0') + ":" +
    String(now.getMinutes()).padStart(2, '0') + ":" +
    String(now.getSeconds()).padStart(2, '0');

    await query(save_order, [
        req.user.uid,
        product_id,
        product_name,
        product_price,
        payment_id,
        Order_date,
        product_img
    ]);
    console.log(product_img)
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

    var total_orders = `SELECT COUNT(*) AS Total_Orders FROM orders WHERE Uid = ?;`
    var all_orders = await query(total_orders,[user_id])

    var getorders = 'SELECT * FROM orders WHERE Uid = ? ORDER BY Order_date DESC';
    var orders = await query(getorders, [user_id]);

    res.render('website/account.ejs', {
        user: user[0],
        orders: orders,
        all_orders:all_orders[0]
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