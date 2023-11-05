function validatePhoneNumber(phoneNumber) {
    const regex1 = /^0\d{9,14}$/
    // const regex2 = /^(\\+62|62)(\\d{8,15})$/
    const regex2 = /^62\d{8,15}$/
    return regex1.test(phoneNumber) || regex2.test(phoneNumber)
}

function validateEmail(email) {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    return regex.test(email)
}

module.exports = { 
    validatePhoneNumber,
    validateEmail,
 }