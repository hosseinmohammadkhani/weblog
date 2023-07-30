const passport = require('passport');
const { Strategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');

passport.use(new Strategy({ usernameField : "email" } , async(email , password , done) => {
    try {

        //finds the first thing related  - finds user by email
        const user = await User.findOne({ email })
        
        //done(error message , user , options)
        if(!user) return done(null , false , { message : "ایمیل یا رمز عبور درست نیست" })
        
        const isMatch = await bcrypt.compare(password , user.password)

        if(isMatch) return done(null , user) //populates req.user
        else return done(null , false , { message : "ایمیل یا رمز عبور درست نیست" })

    } catch (error) {
        console.log(error);
    }
}))

// passport.use(new RememberMeStrategy(
//     function(token, done) {
//       Token.consume(token, function (err, user) {
//         if (err) { return done(err); }
//         if (!user) { return done(null, false); }
//         return done(null, user);
//       });
//     },
//     function(user, done) {
//       var token = utils.generateToken(64);
//       Token.save(token, { userId: user.id }, function(err) {
//         if (err) { return done(err); }
//         return done(null, token);
//       });
//     }
// ));

passport.serializeUser((user , done) => {done(null , user)})

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});