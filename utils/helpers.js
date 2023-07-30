let moment = require('jalali-moment');

module.exports.isAuthenticated = (req , res , next) => {
    if(req.isAuthenticated()) return next()
    else return res.redirect("/404")
}

module.exports.convertToShamsi = (date) =>  moment(date).locale('fa').format('YYYY/M/D')

module.exports.truncate = (str , len) => {
    if(str.length > len && str.length > 0){
        let newStr = str + " "
        newStr = newStr.substring(0 , len)
        newStr = newStr.substring(0 , newStr.lastIndexOf(" "))
        newStr = newStr.length > 0 ? newStr : str.substring(0 , len)
        return newStr + "..."
    }
    return str
}