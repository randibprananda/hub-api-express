const fs = require('fs')
const mime = require('mime-types');

// store pdf file to directory
const storePDFToDirectory = (pdfFile, filePath, res) => {
    pdfFile.mv(filePath, (err) => {
        if (err) {
            console.error(err)
            res.status(500).send("Error saving PDF file")
        } else {
            console.log("PDF file saved successfully")
        }
    })
}

// generate pdf name
const generatePDFNameAndPath = (pdfFile, category) => {
    let fileName = ""
    let filePath = ""
    if (category == "EO") {
        fileName = `konect-portofolio-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/portofolio/eo/${fileName}`
    } else if (category == "Venue") {
        fileName = `konect-portofolio-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/portofolio/venue/${fileName}`
    } else if (category == "Talent") {
        fileName = `konect-portofolio-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/portofolio/talent/${fileName}`
    } else if (category == "Product") {
        fileName = `konect-portofolio-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/portofolio/product/${fileName}`
    } else if (category == 'offering_letter') {
        fileName = `konect-offering_letter-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/BidApp/offering_letter/${fileName}`
    } else if (category == 'concept_presentation') {
        fileName = `konect-concept_presentation-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/BidApp/concept_presentation/${fileName}`
    } else if (category == 'budget_plan') {
        fileName = `konect-budget_plan-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/BidApp/budget_plan/${fileName}`
    } else if (category == "payment_file") {
        fileName = `konect-payment_file-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(pdfFile.mimetype)}`
        filePath = `./assets/payment-file/${fileName}`
    }

    return { fileName, filePath }
}

module.exports = { storePDFToDirectory, generatePDFNameAndPath }