const EOImages = require("../models/EOImagesModel")
const VenueImages = require("../models/VenueImagesModel")
const TalentImages = require("../models/TalentImagesModel")
const ProductImages = require("../models/ProductImagesModel")

const mime = require('mime-types')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')


// get image from db
const getAndCountImageFromDb = async (category, categoryId) => {
    try {
        if (category == "EO") {
            const { count, rows } = await EOImages.findAndCountAll({
                where: {
                    eoServiceId: categoryId,
                },
                attributes: [
                    "image",
                ],
            })

            return { count, rows }
        } else if (category == "Venue") {
            const { count, rows } = await VenueImages.findAndCountAll({
                where: {
                    venueServiceId: categoryId,
                },
                attributes: [
                    "image",
                ],
            })

            return { count, rows }
        } else if (category == "Talent") {
            const { count, rows } = await TalentImages.findAndCountAll({
                where: {
                    talentServiceId: categoryId,
                },
                attributes: [
                    "image",
                ],
            })

            return { count, rows }
        } else if (category == "Product") {
            const { count, rows } = await ProductImages.findAndCountAll({
                where: {
                    productSupplyId: categoryId,
                },
                attributes: [
                    "image",
                ],
            })

            return { count, rows }
        }
    } catch (error) {
        return new Error(`Can't get and count image data of ${category} from database`)
    }
}

// delete image in db
const deleteImageFromDb = async (category, categoryId) => {
    if (category == "EO") {
        await EOImages.destroy({
            where: {
                eoServiceId: categoryId,
            }
        })
    } else if (category == "Venue") {
        await VenueImages.destroy({
            where: {
                venueServiceId: categoryId,
            }
        })
    } else if (category == "Talent") {
        await TalentImages.destroy({
            where: {
                talentServiceId: categoryId,
            }
        })
    } else if (category == "Product") {
        await ProductImages.destroy({
            where: {
                productSupplyId: categoryId,
            }
        })
    }
}

// delete image in directory
const deleteImageFromDirectory = async (image) => {
    if (fs.existsSync(`.${image}`)) {
        fs.unlink(`.${image}`, (err) => {
            if (err) return res.status(500).json({ msg: err })
        })
    }
}

// generate image name base64
const generateBase64ImageNameAndPath = (category) => {
    if (category == "EO") {
        const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.jpeg`
        const imagePath = `/assets/images/eo/${imageName}`

        return { imageName, imagePath }
    } else if (category == "Venue") {
        const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.jpeg`
        const imagePath = `/assets/images/venue/${imageName}`

        return { imageName, imagePath }
    } else if (category == "Talent") {
        const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.jpeg`
        const imagePath = `/assets/images/talent/${imageName}`

        return { imageName, imagePath }
    } else if (category == "Product") {
        const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.jpeg`
        const imagePath = `/assets/images/product/${imageName}`

        return { imageName, imagePath }
    } else if (category == "BannerImages") {
        const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(imageFile.mimetype)}`
        const imagePath = `/assets/banner-images/${imageName}`

        return { imageName, imagePath }
    }
}

// generate image name file
const generateImageNameAndPath = (imageFile, category) => {
    if (category == "payment_file") {
        const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(imageFile.mimetype)}`
        const imagePath = `./assets/payment-file/${imageName}`

        return { imageName, imagePath }
    }
}

// store image to db
const storeImageToDb = async (imagePath, category, categoryId) => {
    try {
        if (category == "EO") {
            await EOImages.create({
                image: imagePath,
                eoServiceId: categoryId,
            })
        } else if (category == "Venue") {
            await VenueImages.create({
                image: imagePath,
                venueServiceId: categoryId,
            })
        } else if (category == "Talent") {
            await TalentImages.create({
                image: imagePath,
                talentServiceId: categoryId,
            })
        } else if (category == "Product") {
            await ProductImages.create({
                image: imagePath,
                productSupplyId: categoryId,
            })
        }
    } catch (error) {
        return new Error(`Can't store image data of ${category} to database`)
    }
}

// convert base64 to jpeg and store it to directory
const convertBase64ToJPEG = async (base64, imageName, category) => {
    // try {
    if (category == "EO") {
        let parts = base64.split(';')
        let imageData = parts[1].split(',')[1]

        const img = new Buffer.from(imageData, 'base64')

        await sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(`./assets/images/eo/${imageName}`)
    } else if (category == "Venue") {
        let parts = base64.split(';')
        let imageData = parts[1].split(',')[1]

        const img = new Buffer.from(imageData, 'base64')

        sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(`./assets/images/venue/${imageName}`)
    } else if (category == "Talent") {
        let parts = base64.split(';')
        let imageData = parts[1].split(',')[1]

        const img = new Buffer.from(imageData, 'base64')

        await sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(`./assets/images/talent/${imageName}`)
    } else if (category == "Product") {
        let parts = base64.split(';')
        let imageData = parts[1].split(',')[1]

        const img = new Buffer.from(imageData, 'base64')

        await sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(`./assets/images/product/${imageName}`)
    } else if (category == "BannerImages") {
        let parts = base64.split(';')
        let imageData = parts[1].split(',')[1]

        const img = new Buffer.from(imageData, 'base64')

        await sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(`./assets/banner-images/${imageName}`)
    }
    // } catch (error) {
    //     return new Error(`Can't convert base64 to jpeg of ${category}'s image and save it into directory`)
    // }
}

const imagebase64Handler = async (imageBase64, path) => {
    return new Promise((resolve, reject) => {
        const uuid = uuidv4()
        const imageName = `konect-image-${uuid}.jpeg`
        const newImagePath = `${path}${imageName}`

        let parts = imageBase64.split(';')
        let imageData = parts[1].split(',')[1]

        const img = new Buffer.from(imageData, 'base64')

        sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(`.${newImagePath}`, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(newImagePath)
                }
            })
    })
}

class ImageHandler {

    // Convert base64 image to .jpeg and store it into directory with given path
    static async storeImageBase64Handler(imageBase64, path) {
        return new Promise((resolve, reject) => {
            const uuid = uuidv4()
            const imageName = `konect-image-${uuid}.jpeg`
            const newImagePath = `${path}${imageName}`
    
            let parts = imageBase64.split(';')
            let imageData = parts[1].split(',')[1]
    
            const img = new Buffer.from(imageData, 'base64')
    
            sharp(img)
                .resize(280, 175)
                .toFormat("jpeg", { mozjpeg: true })
                .jpeg({ quality: 100 })
                .toFile(`.${newImagePath}`, (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(newImagePath)
                    }
                })
        })
    }

    // Delete image from directory
    static async deleteImageHandler(imagePath) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(`.${imagePath}`)) {
                fs.unlink(`.${imagePath}`, (err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve()
                    }
                })
            }
        })
    }
}

module.exports = {
    getAndCountImageFromDb,
    deleteImageFromDb,
    deleteImageFromDirectory,
    generateBase64ImageNameAndPath,
    generateImageNameAndPath,
    storeImageToDb,
    convertBase64ToJPEG,
    imagebase64Handler,
    ImageHandler,
}