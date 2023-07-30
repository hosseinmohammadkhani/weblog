const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const dotEnv = require('dotenv');
const express = require('express');
const path = require('path');
const app = express()
const connectDB = require("./configs/database.js")
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const fileupload = require('express-fileupload');


require('./configs/passport.js');

//parses json and... responses
app.use(bodyParser.urlencoded({ extended : false }))

//Connects the app to database
connectDB()

app.use(session({
    secret : "secret",
    unset : "destroy",
    resave : false,
    store : new MongoStore({ mongooseConnection : mongoose.connection }),
    saveUninitialized : false 
}))

//populates req.flash
app.use(flash())

app.use(require('cookie-parser')())
app.use(passport.initialize());
app.use(passport.session());

//Environmental variables
dotEnv.config({ path : "./configs/config.env" })

//having access to public folder
app.use(express.static(path.join(__dirname , "public")))

//populates req.files
app.use(fileupload())

app.use(require('express-ejs-layouts'))
app.set("views" , "views")
app.set("view enigne" , "ejs")
app.set("layout" , "./layouts/mainLayout.ejs")

app.use("/" , require('./routes/home.js'))
app.use("/404" , require("./controllers/errorControllers.js").show404)
app.use("/500" , require('./controllers/errorControllers.js').show500)
app.use("/dashboard" , require('./routes/dashboard.js'))
app.use("/users" , require("./routes/users.js"))



const PORT = process.env.PORT || 5000

app.listen(PORT , () => console.log(`Server is running on port ${PORT}`))