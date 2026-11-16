const express = require('express')
const admin = express()
const util = require('util')
const cookie = require('cookie-parser')
const fileupload = require('express-fileupload')
const path = require('path')
const fs = require('fs')
var query = require('../database')
require('dotenv').config();
const cloudinary = require('../config/cloudinary');

// =====================MIDELWARES=====================

admin.use(express.static('public'))
admin.use(fileupload())
admin.use(express.urlencoded({extended:true}))


//================Login_check==========================

function Login_check(req,res,next){
    if (req.session.admin_id && req.session.user_email){
        next()
    }
    else{
        res.redirect('/admin/login')
    }
}

// ===============Header DATA==========================

admin.use((req, res, next) => {

    res.locals.user_email = req.session.user_email;
    res.locals.user_name = req.session.user_name;
    res.locals.user_Photo =req.session.user_Photo
    res.locals.admin_id = req.session.admin_id;
    res.locals.Owner = req.session.Owner

    next();
});


//=====================================================
admin.get('/',Login_check,async(req,res)=>{
    var total_order = 'select count(*) as total_order from orders '
    var total_product = 'select count(*) as total_product from add_product '
    var total_message = 'select count(*) as total_message from users_contact_message '
    var total_user = 'select count(*) as total_users from users '
    var pending_message = 'select count(*) as pending_message from users_contact_message where Message_status = "Pending" '
    var total_order_letest = 'select * from orders order by Order_id desc limit 3'
    var total_trending_product = 'select count(*) as trending_product from trending_products '
    var total_product = 'select count(*) as total_product from add_product '
    var total_fashion_product = 'select count(*) as fashion_product from fashion_product '
    var total_electronic_product = 'select count(*) as electronics_product from electronics_products '
    var total_beauty_product = 'select count(*) as beauty_product from beauty_product '
    var total_home_product = 'select count(*) as home_product from home_products '
    var today_payment = `SELECT SUM(Product_price) AS Today_Total_Payment FROM orders WHERE DATE(STR_TO_DATE(Order_date, '%Y-%m-%d %H:%i:%s')) = CURDATE() AND Payment_status = 'Paid'`;
    var total_income = `SELECT SUM(Product_price) AS Total_Income FROM orders WHERE Payment_status = 'Paid'
`;


    var order_count = await query(total_order)
    var total_product_count = await query(total_product)
    var total_message_count = await query(total_message)
    var total_user_count = await query(total_user)
    var pending_message_count = await query(pending_message)
    var total_letest_order  = await query(total_order_letest)
    var total_trending  = await query(total_trending_product)
    var all_product  = await query(total_product)
    var total_fashion_product  = await query(total_fashion_product)
    var total_electronics_product  = await query(total_electronic_product)
    var total_beauty_product  = await query(total_beauty_product)
    var total_home_product  = await query(total_home_product)
    var dayliy_payment = await query(today_payment)
    var all_income = await query(total_income)

    // console.log(total_letest_order)

    res.render('admin/dashbord.ejs',
        {order_count:order_count[0],
        total_product_count:total_product_count[0],
        total_message_count:total_message_count[0],
        total_user_count:total_user_count[0],
        pending_message_count:pending_message_count[0],
        total_letest_order:total_letest_order,
        total_trending:total_trending[0],
        all_product:all_product[0],
        total_fashion_product:total_fashion_product[0],
        total_electronics_product:total_electronics_product[0],
        total_beauty_product:total_beauty_product[0],
        total_home_product:total_home_product[0],
        today_payment_count:dayliy_payment[0],
        total_income:all_income[0]
    })

})



admin.get('/login',(req,res)=>{
    res.render('admin/login_page.ejs')
})

admin.post('/admin_login_check',async(req,res)=>{
    var {admin_email,admin_password} = req.body
    var check_admin = 'SELECT * FROM admin_users WHERE Admin_email = ?  and Admin_password = ? AND Admin_role = "Admin"'
    var admin = await query(check_admin,[admin_email,admin_password])

    var Owner_login = 'select * from admin_users where Admin_email = ? and Admin_password = ? AND Admin_role = "Owner"'
    var Owner = await query(Owner_login,[admin_email,admin_password])

    if(admin[0]){
        req.session.user_email = admin[0].Admin_email
        req.session.user_name = admin[0].Admin_name
        req.session.user_Photo = admin[0].Admin_photo
        req.session.admin_id = admin[0].Aid
        req.session.Owner = ''
        res.redirect('/admin/')
    }
    else if(Owner[0]){
        req.session.user_email = Owner[0].Admin_email
        req.session.user_name = Owner[0].Admin_name
        req.session.user_Photo = Owner[0].Admin_photo
        req.session.admin_id = Owner[0].Aid
        req.session.Owner = 'Owner'
        res.redirect('/admin/')
    }
    else{
        res.redirect('/admin/login')
    }
})

admin.get('/check_admin_user',async(req,res)=>{
    var select_admin = 'SELECT * FROM admin_users where  Admin_role = "Admin"'
    var admin = await query(select_admin)
    res.render('admin/manage_admins.ejs',{all_admin:admin})
})

admin.get('/create_owner/:id',async(req,res)=>{
    var id = req.params.id
    var create_owner = 'update admin_users set Admin_role="Owner" where  Aid=?'
    var owner = await query(create_owner,[id])
    res.redirect('/admin/check_admin_user')
})

admin.get('/delete_admin/:id/:img', async (req, res) => {

    try {
        var id = req.params.id;
        var img = req.params.img;

        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(
            `ecommerce/admin_users/${img}`
        );

        // Delete admin from database
        var delete_admin = 'DELETE FROM admin_users WHERE Aid=?';

        var deleted_adin = await query(delete_admin, [id]);

        res.redirect('/admin/check_admin_user');

    } catch (error) {
        // console.log('Delete Admin Error:', error);
        res.status(500).send('Admin Delete Failed');
    }

});

admin.get('/add_product',Login_check,(req,res)=>{
    res.render('admin/add_product.ejs')
})

admin.post('/add_new_product', async (req, res) => {
    try {
        var {
            product_status,
            product_category,
            product_name,
            product_rating,
            product_reviews,
            new_price,
            old_price,
            Product_qty
        } = req.body;
        // Check Image
        if (!req.files || !req.files.product_img) {
            return res.send('Please select product image');
        }
        // Generate Unique Image Name
        var img = Date.now() + '-' + path.parse(req.files.product_img.name).name;
        // Upload Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.product_img.mimetype};base64,${req.files.product_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/products',
                public_id: img
            }
        );
        // Insert Product Data into MySQL
        var add_product_query = `
            INSERT INTO add_product
            (Product_name, Product_category, Product_status,
            Product_New_price, Product_Old_price,
            Product_review, Product_rating, Product_img,Product_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
        `;
        var add_produt = await query(add_product_query, [
            product_name,
            product_category,
            product_status,
            new_price,
            old_price,
            product_reviews,
            product_rating,
            img,
            Product_qty
        ]);
        res.redirect('/admin/add_product');

    } catch (error) {
        // console.log('Product Upload Error:', error);
        res.status(500).send('Product Upload Failed');
    }

}); 


admin.get('/all_products',Login_check,async(req,res)=>{
    var get_products_query = 'select * from add_product'
    var products = await query(get_products_query)

    res.render('admin/all_product.ejs',{products:products})
})

admin.get('/delete_product/:id/:img', async (req, res) => {
    try {
        var id = req.params.id;
        var old = req.params.img;

        // Delete Image from Cloudinary
        var delete_image = await cloudinary.uploader.destroy(
            `ecommerce/products/${old}`
        );

        // console.log('Cloudinary Image Delete:', delete_image.result);

        // Delete Product from MySQL
        var delete_product = 'DELETE FROM add_product WHERE Pid = ?';

        var delete_pro = await query(delete_product, [id]);

        res.redirect('/admin/all_products');

    } catch (error) {
        // console.log('Delete Product Error:', error);
        res.status(500).send('Product Delete Failed');

    }
});

admin.get('/add_trending_product',Login_check,(req,res)=>{
    res.render('admin/add_trending_product.ejs')
})

admin.post('/save_trending_product', async (req, res) => {

    try {

        var {
            product_discount,
            product_category,
            product_name,
            product_rating,
            product_reviews,
            new_price,
            old_price,
            Product_qty
        } = req.body;

        // Check Image
        if (!req.files || !req.files.product_img) {
            return res.send('Please select product image');
        }

        // Generate Unique Image Name
        var trending_product_img = Date.now() + '-' + path.parse(req.files.product_img.name).name;

        // Upload Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.product_img.mimetype};base64,${req.files.product_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/trending_products',
                public_id: trending_product_img
            }
        );

        // Insert Product into MySQL
        var save_trending_product = `
            INSERT INTO trending_products
            (TProduct_name, TProduct_category, TProduct_discount,
            TProduct_rating, TProduct_review, TProduct_new_price,
            TProduct_old_price, TProduct_image,Product_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        var save_product = await query(save_trending_product, [
            product_name,
            product_category,
            product_discount,
            product_rating,
            product_reviews,
            new_price,
            old_price,
            trending_product_img,
            Product_qty
        ]);

        res.redirect('/admin/add_trending_product');

    } catch (error) {

        // console.log('Trending Product Upload Error:', error);
        res.status(500).send('Trending Product Upload Failed');

    }

});


admin.get("/manage_trending_product",Login_check,async(req,res)=>{
    var select_trending_product = `select * from trending_products`
    var products = await query(select_trending_product)
    res.render('admin/manage_trending_product.ejs',{tproducts:products})
})

admin.get('/delete_trending_product/:id/:img', async (req, res) => {

    try {

        var id = req.params.id;
        var img = req.params.img;

        // Delete Image from Cloudinary
        var delete_image = await cloudinary.uploader.destroy(
            `ecommerce/trending_products/${img}`
        );

        // console.log('Trending Image Delete:', delete_image.result);

        // Delete Trending Product from MySQL
        var delete_trending_product =
            'DELETE FROM trending_products WHERE tpid = ?';

        var delete_t_product = await query(delete_trending_product, [id]);

        res.redirect('/admin/manage_trending_product');

    } catch (error) {

        // console.log('Trending Product Delete Error:', error);
        res.status(500).send('Trending Product Delete Failed');

    }

});

admin.get('/add_fashion_product',Login_check,(req,res)=>{
    res.render('admin/add_fashion_product.ejs')
})

admin.post('/add_new_fashion_product', async (req, res) => {

    try {

        var {
            fashion_product_status,
            fashion_product_category,
            fashion_product_name,
            fashion_product_rating,
            fashion_product_reviews,
            fashion_product_new_price,
            fashion_product_old_price,
            Product_qty
        } = req.body;

        // Check Image
        if (!req.files || !req.files.fashion_product_img) {
            return res.send('Please select fashion product image');
        }
        // Generate Unique Image Name
        var img = Date.now() + '-' + path.parse(req.files.fashion_product_img.name).name;

        // Upload Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.fashion_product_img.mimetype};base64,${req.files.fashion_product_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/fashion_products',
                public_id: img
            }
        );
        // Insert Fashion Product into MySQL
        var Save_fashion_product = `
            INSERT INTO fashion_product
            (fashion_product_name, fashion_product_category,
            fashion_product_status, fashion_product_rating,
            fashion_product_reviews, fashin_product_new_price,
            fashion_product_old_price, fashion_product_img,Product_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        var fashion_product = await query(Save_fashion_product, [
            fashion_product_name,
            fashion_product_category,
            fashion_product_status,
            fashion_product_rating,
            fashion_product_reviews,
            fashion_product_new_price,
            fashion_product_old_price,
            img,
            Product_qty
        ]);

        res.redirect('/admin/add_fashion_product');

    } catch (error) {

        // console.log('Fashion Product Upload Error:', error);
        res.status(500).send('Fashion Product Upload Failed');

    }

});
admin.get('/manage_fashion_product',Login_check,async(req,res)=>{
    var select_fashion_product = 'select * from fashion_product'
    var product = await query(select_fashion_product)
    res.render('admin/manage_fashion_product.ejs',{fashion_product:product})
})

admin.get('/delete_fashion_product/:id/:img', async (req, res) => {
    try {
        var id = req.params.id;
        var old_img = req.params.img;

        // Delete Image from Cloudinary
        var delete_image = await cloudinary.uploader.destroy(
            `ecommerce/fashion_products/${old_img}`
        );

        // console.log('Fashion Image Delete:', delete_image.result);

        // Delete Fashion Product from MySQL
        var delete_fashion_product =
            'DELETE FROM fashion_product WHERE fid = ?';

        var deletee = await query(delete_fashion_product, [id]);

        res.redirect('/admin/manage_fashion_product');

    } catch (error) {

        // console.log('Fashion Product Delete Error:', error);
        res.status(500).send('Fashion Product Delete Failed');

    }

});

admin.get('/add_category_product',Login_check,(req,res)=>{
    res.render('admin/add_category_product.ejs')
})


admin.get('/add_electrounics_product',Login_check,(req,res)=>{
    res.render('admin/add_electronics_product.ejs')
})

admin.post('/add_new_electronics_product', async (req, res) => {

    try {

        var {
            product_status,
            product_category,
            product_name,
            product_brand,
            product_rating,
            product_reviews,
            product_new_price,
            product_old_price,
            product_description,
            Product_qty
        } = req.body;

        // Check Image
        if (!req.files || !req.files.product_img) {
            return res.send('Please select electronics product image');
        }

        // Generate Unique Image Name
        var img = Date.now() + '-' + path.parse(req.files.product_img.name).name;

        // Upload Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.product_img.mimetype};base64,${req.files.product_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/electronics_products',
                public_id: img
            }
        );

        // Insert Electronics Product into MySQL
        var save_electronic_product = `
            INSERT INTO electronics_products
            (Eproduct_status, Eproduct_category, Eproduct_name,
            Eproduct_brand, Eproduct_rating, Eproduct_reviews,
            Eproduct_new_price, Eproduct_old_price,
            Eproduct_description, Eprodcut_img ,Product_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        var save_e_product = await query(save_electronic_product, [
            product_status,
            product_category,
            product_name,
            product_brand,
            product_rating,
            product_reviews,
            product_new_price,
            product_old_price,
            product_description,
            img,
            Product_qty
        ]);

        res.redirect('/admin/add_electrounics_product');

    } catch (error) {

        // console.log('Electronics Product Upload Error:', error);
        res.status(500).send('Electronics Product Upload Failed');

    }

});


admin.get('/manage_electronics_product',Login_check,async(req,res)=>{
    var all_electronics_prodcut = 'select * from electronics_products'
    var E_prodcts = await query(all_electronics_prodcut)
    res.render('admin/manage_electronics_product.ejs',{E_prodcts:E_prodcts})
})

admin.get('/delete_electronics_product/:id/:img', async (req, res) => {

    try {

        var id = req.params.id;
        var img = req.params.img;

        // Delete Image from Cloudinary
        var delete_image = await cloudinary.uploader.destroy(
            `ecommerce/electronics_products/${img}`
        );

        // console.log('Electronics Image Delete:', delete_image.result);

        // Delete Product from MySQL
        var delete_electronic =
            'DELETE FROM electronics_products WHERE Eid = ?';

        var delete_product1 = await query(delete_electronic, [id]);

        res.redirect('/admin/manage_electronics_product');

    } catch (error) {

        // console.log('Electronics Product Delete Error:', error);
        res.status(500).send('Electronics Product Delete Failed');

    }

});
admin.get('/add_beauty_product',Login_check,(req,res)=>{
    res.render('admin/add_beauty_product.ejs')
})

admin.post('/add_new_beauty_product', async (req, res) => {

    try {
        var {
            Product_Status,
            product_category,
            product_brand,
            product_rating,
            product_reviews,
            product_new_price,
            product_old_price,
            product_quantity,
            product_description,
            product_name,
            Product_qty
        } = req.body;

        // Check Image
        if (!req.files || !req.files.product_img) {
            return res.send('Please select beauty product image');
        }

        // Generate Unique Image Name
        var img = Date.now() + '-' + path.parse(req.files.product_img.name).name;

        // Upload Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.product_img.mimetype};base64,${req.files.product_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/beauty_products',
                public_id: img
            }
        );
        // Insert Beauty Product into MySQL
        var save_beauti_product = `
            INSERT INTO beauty_product
            (product_name, product_brand, product_category, Product_Status,
            product_rating, product_reviews, product_new_price,
            product_old_price, product_quantity, product_description,
            Prdouct_image,Product_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        var save_query = await query(save_beauti_product, [
            product_name,
            product_brand,
            product_category,
            Product_Status,
            product_rating,
            product_reviews,
            product_new_price,
            product_old_price,
            product_quantity,
            product_description,
            img,
            Product_qty
        ]);
        res.redirect('/admin/add_beauty_product');

    } catch (error) {

        // console.log('Beauty Product Upload Error:', error);
        res.status(500).send('Beauty Product Upload Failed');

    }

});

admin.get('/mange_beaut_product',Login_check,async(req,res)=>{
    var total_beauty = 'select * from beauty_product'
    var product = await query(total_beauty)
    res.render('admin/manage_beauty_product.ejs',{product:product})
})

admin.get('/delete_beauty_product/:id/:img', async (req, res) => {

    try {

        var id = req.params.id;
        var img = req.params.img;

        // Delete Image from Cloudinary
        var delete_image = await cloudinary.uploader.destroy(
            `ecommerce/beauty_products/${img}`
        );

        // console.log('Beauty Image Delete:', delete_image.result);

        // Delete Product from MySQL
        var delete_product = `DELETE FROM beauty_product WHERE pid = ?`;

        var deletet = await query(delete_product, [id]);

        res.redirect('/admin/mange_beaut_product');

    } catch (error) {

        // console.log('Beauty Product Delete Error:', error);
        res.status(500).send('Beauty Product Delete Failed');

    }

});

// admin.post('/add_new_home_living_product',async(req,res)=>{
  
//     var {Product_status,product_category,product_name,product_brand,product_rating,product_reviews,product_new_price,product_old_price,product_material,product_color,product_size,product_description} = req.body
//     var img = Date.now()+req.files.product_img.name
//     var img_save_location = path.join(__dirname,'../public/images/'+img)
//     req.files.product_img.mv(img_save_location,(err)=>{})
//     var save_home_prducts = 'insert into home_products (product_name,Product_status,product_category,product_brand,product_rating,product_reviews,product_new_price,product_old_price,product_material,product_color,product_size,product_img,product_description) values(?,?,?,?,?,?,?,?,?,?,?,?,?)'
//     var products = await query(save_home_prducts,[product_name,Product_status,product_category,product_brand,product_rating,product_reviews,product_new_price,product_old_price,product_material,product_color,product_size,img,product_description])
//     res.redirect('/admin/add_home_and_leaving_product')
// })
// admin.get('/manage_home_leaving_product',Login_check,async(req,res)=>{
//     var home_products = 'select * from home_products'
//     var products = await query(home_products)
//     res.render('admin/manage_home_leaving_product.ejs',{products:products})
// })

// admin.get('/delete_home_living_product/:id/:img',async(req,res)=>{
//     var id = req.params.id
//     var img = req.params.img

//     var delete_img = path.join(__dirname,'../public/images/'+img)
//     fs.unlink(delete_img,(err)=>{})

//     var product = 'delete from home_products where Pid=?'
//     var delete_product = await query(product,[id])
//     res.redirect('/admin/manage_home_leaving_product')
    
// })

admin.get('/add_category',Login_check,(req,res)=>{
    res.render('admin/add_category_product.ejs')
})

admin.post('/add_category_product', async (req, res) => {

    try {

        var { category_name, category_note } = req.body;

        // Check Image
        if (!req.files || !req.files.category_img) {
            return res.send('Please select category image');
        }

        // Generate Unique Image Name
        var ctegory_product_img = Date.now() + '-' + path.parse(req.files.category_img.name).name;

        // Upload Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.category_img.mimetype};base64,${req.files.category_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/category_products',
                public_id: ctegory_product_img
            }
        );

        // Insert Category into MySQL
        var save_product = `
            INSERT INTO category_product
            (Product_category, Product_name, Product_image)
            VALUES (?, ?, ?)
        `;

        var save = await query(save_product, [
            category_name,
            category_note,
            ctegory_product_img
        ]);

        res.redirect('/admin/add_category');

    } catch (error) {

        // console.log('Category Product Upload Error:', error);
        res.status(500).send('Category Product Upload Failed');

    }

});

admin.get('/all_categories',Login_check,async(req,res)=>{
    var select_category_product = 'select * from category_product'
    var products = await query(select_category_product)
    res.render('admin/manage_category_product.ejs',{products:products})
})

admin.get('/delete_category_product/:id/:img', async (req, res) => {

    try {

        var id = req.params.id;
        var img = req.params.img;

        // Delete Image from Cloudinary
        var delete_image = await cloudinary.uploader.destroy(
            `ecommerce/category_products/${img}`
        );

        // console.log('Category Image Delete:', delete_image.result);

        // Delete Product from MySQL
        var delete_product = 'DELETE FROM category_product WHERE cpid = ?';

        var deletep = await query(delete_product, [id]);

        res.redirect(req.get('Referrer') || '/admin');

    } catch (error) {

        // console.log('Category Product Delete Error:', error);
        res.status(500).send('Category Product Delete Failed');

    }

});
admin.get('/all_orders',Login_check,async(req,res)=>{

    var all_orders = `SELECT orders.*,users.user_name AS customer_name,
                    users.user_address AS customer_address,
                    users.user_mobile AS customer_mobile FROM orders
                     INNER JOIN users ON orders.Uid = users.Uid;`

    var orders = await query(all_orders)
    // console.log(orders)
    res.render('admin/all_orders.ejs',{orders:orders})
})

admin.get('/delete_order/:id',async(req,res)=>{
    var id = req.params.id
    var delete_order = 'delete from orders where Order_id = ?'
    var dele = await query(delete_order,[id])
    res.redirect(req.get('Referrer') || '/admin');

})

admin.get('/all_messages',async(req,res)=>{
    var all_message = 'select * from users_contact_message'
    var messages = await query(all_message)
    res.render('admin/all_message.ejs',{pending:messages})
})

admin.get('/pending_messages',async(req,res)=>{
    var pending_message = 'select * from users_contact_message where Message_status= "Pending" '
    var pending = await query(pending_message)
    res.render('admin/pending_message.ejs',{pending:pending})
})

admin.get('/accept_customer_message/:id',async(req,res)=>{
    var id = req.params.id
    var accept_message = 'update users_contact_message set Message_status="Accept" where Mid=?'
    var accept = await query(accept_message,[id])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/confirm_customer_message/:id',async(req,res)=>{
    var id = req.params.id
    var accept_message = 'update users_contact_message set Message_status="Confirm" where Mid=?'
    var accept = await query(accept_message,[id])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/confirmed_messages',async(req,res)=>{
    var confirm_message = 'select * from users_contact_message where Message_status= "Confirm" '
    var pending = await query(confirm_message)
    res.render('admin/confirm_message.ejs',{pending:pending})
})

admin.get('/accepted_messages',async(req,res)=>{
    var confirm_message = 'select * from users_contact_message where Message_status= "Accept" '
    var pending = await query(confirm_message)
    res.render('admin/accept_message.ejs',{pending:pending})
})

admin.get('/pending_customer_message/:id',async(req,res)=>{
    var id = req.params.id
    var pending_message = 'update users_contact_message set Message_status="Pending" where Mid=?'
    var pending = await query(pending_message,[id])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/reject_customer_message/:id',async(req,res)=>{
    var id = req.params.id
    var pending_message = 'update users_contact_message set Message_status="Reject" where Mid=?'
    var pending = await query(pending_message,[id])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/all_customers',Login_check,async(req,res)=>{
    var all_customers = 'select * from users'
    var users = await query(all_customers)
    res.render('admin/all_customers.ejs',{users:users})
})

admin.get('/add_contact',Login_check,(req,res)=>{
    res.render('admin/add_contact_option.ejs')
})

admin.post('/save_contact_option',async(req,res)=>{
    var {Contact_icon,Contact_name,Option_note,Contact_text}=req.body

    var save_contact = 'insert into contact_option (contact_icon,contact_contact_name,contact_option_note,contact_text) values(?,?,?,?)'
    var save = await query(save_contact,[Contact_icon,Contact_name,Option_note,Contact_text])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/View_all_contact',async(req,res)=>{
    var all_contact = 'select * from contact_option'
    var all_contact_options = await query(all_contact)
    res.render('admin/view_all_contact.ejs',{all_contact_options:all_contact_options})

    all_contact_options
})

admin.get('/delete_contact_option/:id',async(req,res)=>{
    var id = req.params.id
    var delete_contact = 'delete from contact_option where cid = ?'
    var deletet = await query(delete_contact,[id])
    res.redirect('/admin/View_all_contact')
})

admin.get('/add_new_admin_user_product',Login_check,(req,res)=>{
    res.render('admin/add_admin_user.ejs',{msg: req.session.msg})
})

admin.post('/save_admin_user', async (req, res) => {

    try {

        var {
            admin_name,
            admin_email,
            admin_mobile,
            admin_dob,
            add_admin_date,
            admin_password
        } = req.body;

        // Check Image
        if (!req.files || !req.files.admin_img) {
            return res.send('Please select admin profile image');
        }

        // Check Existing Admin Email
        var find_old_admin = 'SELECT * FROM admin_users WHERE Admin_email = ?';

        var admin_find = await query(find_old_admin, [admin_email]);

        if (admin_find.length > 0) {

            req.session.msg = 'Please Enter Other Email And Password';

            return res.redirect('/admin/add_new_admin_user_product');

        }

        // Generate Unique Image Name
        var admin_img = Date.now() + '-' + path.parse(req.files.admin_img.name).name;

        // Upload Admin Image to Cloudinary
        var upload_result = await cloudinary.uploader.upload(
            `data:${req.files.admin_img.mimetype};base64,${req.files.admin_img.data.toString('base64')}`,
            {
                folder: 'ecommerce/admin_users',
                public_id: admin_img
            }
        );

        // Save Admin Data into MySQL
        var save_user = `
            INSERT INTO admin_users
            (Admin_name, Admin_email, Admin_mobile, Admin_dob,
            Admin_added_date, Admin_password, Admin_photo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        var save = await query(save_user, [
            admin_name,
            admin_email,
            admin_mobile,
            admin_dob,
            add_admin_date,
            admin_password,
            admin_img
        ]);

        req.session.msg = 'Admin Register Successfully';

        res.redirect('/admin/add_new_admin_user_product');

    } catch (error) {

        console.log('Admin User Upload Error:', error);
        res.status(500).send('Admin User Registration Failed');

    }

});

admin.get('/profile',async(req,res)=>{
    var id = req.session.admin_id
    var select_admin = 'select * from admin_users where Aid = ?'
    var update_admin = await query(select_admin,[id])
    res.render('admin/update_admin.ejs',{admin:update_admin[0]})
})


admin.post('/update_admin_user/:id', async (req, res) => {

    try {

        var {
            admin_name,
            admin_email,
            admin_mobile,
            admin_dob,
            add_admin_date,
            admin_password
        } = req.body;

        var id = req.params.id;
        var old_admin_img = req.body.admin_old_img;
        // Server Side Image Size Validation
if (req.files && req.files.admin_img) {

    var image_size = req.files.admin_img.size;

    if (image_size > 300 * 1024) {
        return res.status(400).send('Image size must be below 300 KB');
    }

    if (!req.files.admin_img.mimetype.startsWith('image/')) {
        return res.status(400).send('Please select a valid image');
    }
}

        var new_img = old_admin_img;

        // Upload New Image
        if (req.files && req.files.admin_img) {

            new_img = Date.now() + '-' +
                path.parse(req.files.admin_img.name).name;

            await cloudinary.uploader.upload(
                `data:${req.files.admin_img.mimetype};base64,${req.files.admin_img.data.toString('base64')}`,
                {
                    folder: 'ecommerce/admin_users',
                    public_id: new_img,
                    timeout: 120000
                }
            );
        }

        // Update Admin Database
        var update_admin = `
            UPDATE admin_users SET
            Admin_name=?,
            Admin_email=?,
            Admin_mobile=?,
            Admin_dob=?,
            Admin_added_date=?,
            Admin_password=?,
            Admin_photo=?
            WHERE Aid=?
        `;

        await query(update_admin, [
            admin_name,
            admin_email,
            admin_mobile,
            admin_dob,
            add_admin_date,
            admin_password,
            new_img,
            id
        ]);

        // Delete Old Image
        if (req.files && req.files.admin_img && old_admin_img) {

            await cloudinary.uploader.destroy(
                `ecommerce/admin_users/${old_admin_img}`
            );
        }

        res.redirect('/admin/profile');

    } catch (error) {

        console.log('Admin Update Error:', error);

        res.status(500).send('Admin Profile Update Failed');

    }

});


admin.get('/check_Owner',async(req,res)=>{
    var select = 'select * from  admin_users as admin where Admin_role="Owner"'
    var owners = await query(select)
    res.render('admin/owners.ejs',{all_admin:owners})
})

admin.get('/create_admin/:id',async(req,res)=>{
    var id = req.params.id
    var create_admin = 'update admin_users set Admin_role="Admin" where Aid =?'
    var admin = await query(create_admin,[id])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/today_orders',Login_check,async(req,res)=>{
  var today_order = `
    SELECT
        orders.Product_image AS Product_image,
        users.user_name AS customer_name,
        users.user_mobile AS customer_mobile,
        orders.Product_name,
        orders.Product_qty,
        orders.Product_price,
        orders.Order_date,
        users.user_address AS customer_address,
        orders.Order_status,
        orders.Payment_status,
        orders.Payment_id,
        orders.Order_id,
        orders.Product_size,
        orders.Product_folder,
        orders.Product_image




    FROM orders

    INNER JOIN users
    ON orders.Uid = users.Uid

    WHERE
    STR_TO_DATE(orders.Order_date, '%Y-%m-%d %H:%i:%s') >= CURDATE()
    AND
    STR_TO_DATE(orders.Order_date, '%Y-%m-%d %H:%i:%s') < CURDATE() + INTERVAL 1 DAY

    ORDER BY orders.Order_date DESC
`;

    var orders = await query(today_order)
     
    // console.log(orders)
    res.render('admin/today_orders.ejs',{today_all_orders:orders})
})



admin.get('/confirm_order',Login_check,async(req,res)=>{
      var confirm_order = `
    SELECT
        orders.Product_image AS Product_image,
        users.user_name AS customer_name,
        users.user_mobile AS customer_mobile,
        orders.Product_name,
        orders.Product_qty,
        orders.Product_price,
        orders.Order_date,
        users.user_address AS customer_address,
        orders.Order_status,
        orders.Payment_status,
        orders.Payment_id,
        orders.Order_id,
        orders.Product_size,
        orders.Product_folder,
        orders.Product_image


    FROM orders

    INNER JOIN users
    ON orders.Uid = users.Uid

    WHERE
    STR_TO_DATE(orders.Order_date, '%Y-%m-%d %H:%i:%s') >= CURDATE()
    AND
    STR_TO_DATE(orders.Order_date, '%Y-%m-%d %H:%i:%s') < CURDATE() + INTERVAL 1 DAY

    and Order_status = 'Confirm'


    ORDER BY orders.Order_date DESC
`;

    var orders = await query(confirm_order)
     
    // console.log(orders)
    res.render('admin/confirm_orders.ejs',{today_all_confirm_orders:orders})
})

admin.get('/confirm_order/:id',async(req,res)=>{
    var id = req.params.id
    var update_order_status = 'update orders set Order_status="Confirm" where Order_id=?'
    var update = await query(update_order_status,[id])
    res.redirect(req.get('Referrer') || '/admin');
    
})

admin.get('/dispatched_order/:id',async(req,res)=>{
    var id = req.params.id
    var update_order_status = 'update orders set Order_status="Order Dispatched" where Order_id=?'
    var update = await query(update_order_status,[id])
    res.redirect(req.get('Referrer') || '/admin');
})

admin.get('/dispatched_order',Login_check,async(req,res)=>{
    var dispatched_order = `
    SELECT
        orders.Product_image AS Product_image,
        users.user_name AS customer_name,
        users.user_mobile AS customer_mobile,
        orders.Product_name,
        orders.Product_qty,
        orders.Product_price,
        orders.Order_date,
        users.user_address AS customer_address,
        orders.Order_status,
        orders.Payment_status,
        orders.Payment_id,
        orders.Order_id,
        orders.Product_size,
        orders.Product_folder,
        orders.Product_image

    FROM orders

    INNER JOIN users
    ON orders.Uid = users.Uid

    WHERE
    STR_TO_DATE(orders.Order_date, '%Y-%m-%d %H:%i:%s') >= CURDATE()
    AND
    STR_TO_DATE(orders.Order_date, '%Y-%m-%d %H:%i:%s') < CURDATE() + INTERVAL 1 DAY

    and Order_status = 'Order Dispatched'


    ORDER BY orders.Order_date DESC
`;
   

    var orders = await query(dispatched_order)
     
    // console.log(orders)
    res.render('admin/dispatched_orders.ejs',{today_dispatched_order:orders})

})






















admin.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/admin/login')
})
module.exports = admin