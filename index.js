var express = require("express")
var ejs = require("ejs")
var bodyParser = require("body-parser")
var mysql = require("mysql")
var path = require("path")
var session = require("express-session")

mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"node_project"
})

var app = express()
app.use("/public", express.static(path.join(__dirname, "public")))
app.set("view engine", "ejs")
app.listen("8000")
app.use(bodyParser.urlencoded({extended:true}))
app.use(session({secret:"secret"}))

function isProductInCart(cart, id){
    for(let i=0; i<cart.length; i++){
        if(cart[i].id == id){
            return true
        }
    }
    return false
}

function calculateTotal(cart, request){
    total = 0
    for(let i=0; i<cart.length; i++){
        if(cart[i].sale_price){
            total = total + (cart[i].sale_price*cart[i].quantity)
        }else{
            total = total + (cart[i].price*cart[i].quantity)
        }
    }
    request.session.total = total
    return total
}

app.get("/", function(request, response){
    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"node_project"
    })

    con.query("SELECT * FROM products",(error, result)=>{
        response.render("pages/index",{result:result})
    })
})

app.post("/add_to_cart", function(request, response){
    var id = request.body.id
    var name = request.body.name
    var price = request.body.price
    var sale_price = request.body.sale_price
    var quantity = request.body.quantity
    var image = request.body.image
    var product = {id:id,name:name,price:price,sale_price:sale_price,quantity:quantity,image:image}

    if(request.session.cart){
        var cart = request.session.cart
        if(!isProductInCart(cart, id)){
            cart.push(product)
        }
    }else{
        request.session.cart = [product]
        var cart = request.session.cart
    }

    calculateTotal(cart, request)
    response.redirect("/cart")
})

app.get("/cart", function(request, response){
    var cart = request.session.cart
    var total = request.session.total

    response.render("pages/cart",{cart:cart,total:total})
})


app.post("/remove_product", function(request, response){
    var id = request.body.id
    var cart = request.session.cart

    for(let i=0; i<cart.length; i++){
        if(cart[i].id == id){
            cart.splice(cart.indexOf(i),1)
        }
    }

    calculateTotal(cart, request)
    response.redirect("/cart")
})

app.post("/edit_product_quantity", function(request, response){
    var id = request.body.id
    var quantity = request.body.quantity
    var decrease_button = request.body.decrease_product_quantity
    var increase_button = request.body.increase_product_quantity
    var cart = request.session.cart

    if(increase_button){
        for(let i=0; i<cart.length; i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 0){
                    cart[i].quantity = parseInt(cart[i].quantity)+1
                }
            }
        }
    }

    if(decrease_button){
        for(let i=0; i<cart.length; i++){
            if(cart[i].id == id){
                if(cart[i].quantity > 1){
                    cart[i].quantity = parseInt(cart[i].quantity)-1
                }
            }
        }
    }

    calculateTotal(cart, request)
    response.redirect("/cart")
})

app.get("/checkout",function(request, response){
    var total = request.session.total
    response.render("pages/checkout",{total:total})
})

app.post("/place_order", function(request, response){
    var name = request.body.name
    var email = request.body.email
    var phone = request.body.phone
    var city = request.body.city
    var address = request.body.address
    var cost = request.session.total
    var status = "Not Paid"
    var date = new Date()
    var products_ids = ""

    var con = mysql.createConnection({
        host:"localhost",
        user:"root",
        password:"",
        database:"node_project"
    })

    var cart = request.session.cart
    for(i=0; i<cart.length; i++){
        products_ids = products_ids + "," + cart[i].id
    }

    con.connect((error)=>{
        if(error){
            console.log(error)
        }else{
            var query = "INSERT INTO orders(cost,name,email,status,city,address,phone,date,products_ids) VALUES ?"
            var values = [
                [cost,name,email,status,city,address,phone,date,products_ids]
            ]
            con.query(query,[values],(error,result)=>{
                response.redirect("/payment")
            })
        }
    })
    
})

app.get("/payment", function(request, response){
    response.render("pages/payment")
})


