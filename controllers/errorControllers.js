module.exports.show404 = (req , res) => {
    return res.render("./errors/404.ejs" , {
        pageTitle : "خطای 404",
        path : "/404",
    })
}
module.exports.show500 = (req , res) => {
    return res.render("./errors/500.ejs" , {
        pageTitle : "خطای 500",
        path : "/500",
    })
}