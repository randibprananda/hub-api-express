const Companies = require("../models/CompaniesModel.js");
const LegalDocuments = require("../models/LegalDocumentsModel.js");
const Users = require("../models/UsersModel.js");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const mime = require('mime-types');
const { Op } = require("sequelize");

const getCompanies = async (req, res) => {
    try {
        const response = await Companies.findAll();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getCompaniesById = async (req, res) => {
    try {
        const response = await Companies.findOne({
            where: {
                id: req.params.id
            },
            attributes: {
                exclude: [
                    'createdAt',
                    'updatedAt'
                ]
            },
            include: {
                model: LegalDocuments,
                attributes: {
                    exclude: [
                        'companyId',
                        'createdAt',
                        'updatedAt'
                    ]
                }
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const createCompanies = async (req, res) => {
    const { name, type, city, province, postal_code, address } = req.body;
    try {
        await Companies.create({
            name: name,
            type: type,
            city: city,
            province: province,
            postal_code: postal_code,
            address: address
        });
        res.status(201).json({ msg: 'Create Companies Success' });
    } catch (error) {
        res.status(400).json({ msg: 'Data cannot be blank' });
    }
}

const updateCompanies = async (req, res) => {
    try {
        const companies = await Companies.findOne({
            where: {
                id: req.params.id
            }
        });
    
        if (!companies) return res.status(404).json({ msg: "No Data Found" });
        const { name, description, email, phone, type, type_business, type_siup, city, province, postal_code, address, company_logo, pic_name, pic_position, pic_phone, pic_email, website_url, website_type, marketplace_url, marketplace_type } = req.body;
        
        const number = phone?.replace(/^0/, '62')
        const pic_number = pic_phone?.replace(/^0/, '62')
        if(marketplace_url != null && marketplace_url != ""){
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            const vlaidationURL = urlRegex.test(marketplace_url)
            if(vlaidationURL == false){
                return res.status(400).json({msg: 'marketplace url must be url'})
            }
        }

        if (typeof company_logo === 'undefined' || company_logo === '') {
            await Companies.update({
                name: name,
                description: description,
                email: email,
                phone: number,
                type: type,
                type_business: type_business,
                type_siup: type_siup,
                city: city,
                province: province,
                postal_code: postal_code,
                address: address,
                company_logo: companies.company_logo,
                pic_name: pic_name,
                pic_position: pic_position,
                pic_phone: pic_number,
                pic_email: pic_email,
                website_url: website_url,
                website_type: website_type,
                marketplace_url: marketplace_url,
                marketplace_type: marketplace_type
            }, {
                where: {
                    id: companies.id
                }
            });
        } else {

            let currentImage;
            if (companies.company_logo === null) {
                currentImage === company_logo
            } else {
                currentImage = `.${companies.company_logo}`

                if (fs.existsSync(currentImage)) {
                    fs.unlinkSync(currentImage, (err) => {
                        if (err) return res.status(500).json({ msg: err })
                    })

                }
            }

            let parts = company_logo.split(';');
            let imageData = parts[1].split(',')[1];

            const img = new Buffer.from(imageData, 'base64')
            // Memeriksa ukuran buffer
            if (img.length > 2 * 1024 * 1024) {
                return res.status(400).json({ msg: 'Ukuran file base64 melebihi batas (2 MB).' });
            }
            const imageName = `konect-image-${Date.now()}.jpeg`

            await sharp(img)
                .resize(280, 174)
                .toFormat("jpeg", { mozjpeg: true })
                .jpeg({ quality: 100 })
                .toFile(`./assets/images/company/${imageName}`);

            await Companies.update({
                name: name,
                description: description,
                email: email,
                phone: number,
                type: type,
                type_business: type_business,
                type_siup: type_siup,
                city: city,
                province: province,
                postal_code: postal_code,
                address: address,
                company_logo: `/assets/images/company/${imageName}`,
                pic_name: pic_name,
                pic_position: pic_position,
                pic_phone: pic_number,
                pic_email: pic_email,
                website_url: website_url,
                website_type: website_type,
                marketplace_url: marketplace_url,
                marketplace_type: marketplace_type
            }, {
                where: {
                    id: companies.id
                }
            });
        }

        let document = []

        if (req.files != null) {
            const { NIB_document, SIUP_document, IUMK_document, IUI_document, Other_document, Sertification_document } = req.files
            //handle document must be format pdf
            if(NIB_document != null && NIB_document.mimetype !=  "application/pdf"){
                return res.status(400).json({msg: "NIB_document must be PDF!"})
            }else if (SIUP_document != null && SIUP_document.mimetype !=  "application/pdf"){
                return res.status(400).json({msg: "SIUP_document must be PDF!"})
            }else if (IUMK_document != null && IUMK_document.mimetype !=  "application/pdf"){
                return res.status(400).json({msg: "IUMK_document must be PDF!"})
            }else if (IUI_document != null && IUI_document.mimetype !=  "application/pdf"){
                return res.status(400).json({msg: "IUI_document must be PDF!"})
            }else if (Other_document != null && Other_document.mimetype !=  "application/pdf"){
                return res.status(400).json({msg: "Other_document must be PDF!"})
            }else if (Sertification_document != null && Sertification_document.mimetype !=  "application/pdf"){
                return res.status(400).json({msg: "Sertification_document must be PDF!"})
            }

            if (typeof NIB_document !== 'undefined') {
                const existsNIB = await LegalDocuments.findOne({
                    where: {
                        companyId: companies.id,
                        type: 'NIB'
                    }
                })

                if (existsNIB) {
                    fs.unlinkSync(`.${existsNIB.path}`)
                    await LegalDocuments.destroy({
                        where: {
                            companyId: companies.id,
                            type: 'NIB'
                        }
                    })
                }

                const fileName = `konect-NIB-document-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(NIB_document.mimetype)}`
                const filePath = `./assets/document/NIB/${fileName}`
                NIB_document.mv(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send("Error saving PDF file")
                    } else {
                        console.log("PDF file saved successfully")
                    }
                })

                document.push({
                    path: `/assets/document/NIB/${fileName}`,
                    type: 'NIB',
                    companyId: companies.id
                })
            }

            if (typeof SIUP_document !== 'undefined') {
                const existsSIUP = await LegalDocuments.findOne({
                    where: {
                        companyId: companies.id,
                        type: 'SIUP'
                    }
                })

                if (existsSIUP) {
                    fs.unlinkSync(`.${existsSIUP.path}`)
                    await LegalDocuments.destroy({
                        where: {
                            companyId: companies.id,
                            type: 'SIUP'
                        }
                    })
                }

                const fileName = `konect-SIUP-document-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(SIUP_document.mimetype)}`
                const filePath = `./assets/document/SIUP/${fileName}`
                SIUP_document.mv(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send("Error saving PDF file")
                    } else {
                        console.log("PDF file saved successfully")
                    }
                })

                document.push({
                    path: `/assets/document/SIUP/${fileName}`,
                    type: 'SIUP',
                    companyId: companies.id
                })
            }

            if (typeof IUMK_document !== 'undefined') {
                const existsIUMK = await LegalDocuments.findOne({
                    where: {
                        companyId: companies.id,
                        type: 'IUMK'
                    }
                })

                if (existsIUMK) {
                    fs.unlinkSync(`.${existsIUMK.path}`)
                    await LegalDocuments.destroy({
                        where: {
                            companyId: companies.id,
                            type: 'IUMK'
                        }
                    })
                }

                const fileName = `konect-IUMK-document-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(IUMK_document.mimetype)}`
                const filePath = `./assets/document/IUMK/${fileName}`
                IUMK_document.mv(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send("Error saving PDF file")
                    } else {
                        console.log("PDF file saved successfully")
                    }
                })

                document.push({
                    path: `/assets/document/IUMK/${fileName}`,
                    type: 'IUMK',
                    companyId: companies.id
                })
            }

            if (typeof IUI_document !== 'undefined') {
                const existsIUI = await LegalDocuments.findOne({
                    where: {
                        companyId: companies.id,
                        type: 'IUI'
                    }
                })

                if (existsIUI) {
                    fs.unlinkSync(`.${existsIUI.path}`)
                    await LegalDocuments.destroy({
                        where: {
                            companyId: companies.id,
                            type: 'IUI'
                        }
                    })
                }

                const fileName = `konect-IUI-document-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(IUI_document.mimetype)}`
                const filePath = `./assets/document/IUI/${fileName}`
                IUI_document.mv(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send("Error saving PDF file")
                    } else {
                        console.log("PDF file saved successfully")
                    }
                })

                document.push({
                    path: `/assets/document/IUI/${fileName}`,
                    type: 'IUI',
                    companyId: companies.id
                })
            }

            if (typeof Other_document !== 'undefined') {
                const existsOther = await LegalDocuments.findOne({
                    where: {
                        companyId: companies.id,
                        type: 'Other'
                    }
                })

                if (existsOther) {
                    fs.unlinkSync(`.${existsOther.path}`)
                    await LegalDocuments.destroy({
                        where: {
                            companyId: companies.id,
                            type: 'Other'
                        }
                    })
                }

                const fileName = `konect-Other-document-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(Other_document.mimetype)}`
                const filePath = `./assets/document/Other/${fileName}`
                Other_document.mv(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send("Error saving PDF file")
                    } else {
                        console.log("PDF file saved successfully")
                    }
                })

                document.push({
                    path: `/assets/document/Other/${fileName}`,
                    type: 'Other',
                    companyId: companies.id
                })
            }

            if (typeof Sertification_document !== 'undefined') {
                const existsSertification = await LegalDocuments.findOne({
                    where: {
                        companyId: companies.id,
                        type: 'Sertification'
                    }
                })

                if (existsSertification) {
                    fs.unlinkSync(`.${existsSertification.path}`)
                    await LegalDocuments.destroy({
                        where: {
                            companyId: companies.id,
                            type: 'Sertification'
                        }
                    })
                }

                const fileName = `konect-Sertification-document-${Date.now() * Math.floor(Math.random() * 101)}.${mime.extension(Sertification_document.mimetype)}`
                const filePath = `./assets/document/Sertification/${fileName}`
                Sertification_document.mv(filePath, (err) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send("Error saving PDF file")
                    } else {
                        console.log("PDF file saved successfully")
                    }
                })

                document.push({
                    path: `/assets/document/Sertification/${fileName}`,
                    type: 'Sertification',
                    companyId: companies.id
                })
            }
        }
        
        const documentTypes = ['NIB', 'SIUP', 'IUMK', 'IUI', 'Other', 'Sertification']
        for (const type of documentTypes) {
            const document = req[`${type}_document`];
            const body = req.body.NIB_document || null
            if (typeof document === 'undefined' && body == null) {
                const existsSertification = await LegalDocuments.findOne({
                    where: {
                    companyId: companies.id,
                    type,
                    }
                });
                
                if (existsSertification) {
                    fs.unlinkSync(`.${existsSertification.path}`);
                    await LegalDocuments.destroy({
                    where: {
                        companyId: companies.id,
                        type,
                    }
                    });
                }
            }
        }

        if (document.length !== 0) {
            LegalDocuments.bulkCreate(document)
        }

        await LegalDocuments.destroy({
            where: {
                companyId: companies.id,
                type: null
            }
        })

        const isUnverifiedCompany = await Companies.count({
            where: {
                id: companies.id,
                [Op.or]: [
                    { name: null },
                    { description: null },
                    { email: null },
                    { phone: null },
                    { type: null },
                    { type_business: null },
                    { type_siup: null },
                    { city: null },
                    { province: null },
                    { postal_code: null },
                    { address: null },
                    { company_logo: null },
                    { pic_name: null },
                    { pic_position: null },
                    { pic_phone: null },
                    { pic_email: null },
                    { website_url: null },
                    { website_type: null },
                    { marketplace_url: null },
                    { marketplace_type: null },
                ],
            },
        })

        const countLegalDocuments = await LegalDocuments.count({
            where: {
                companyId: companies.id,
                [Op.or]: [
                    { id: { [Op.not]: null } },
                    { path: { [Op.not]: null } },
                ],
                [Op.or]: [
                    { type: 'NIB' },
                    { type: 'SIUP' },
                    { type: 'IUMK' },
                    { type: 'IUI' },
                    { type: 'Sertification' },
                ],
            },
        })

        if (isUnverifiedCompany == 0 && countLegalDocuments >= 5) {
            await Companies.update({
                is_verified_company: true,
            }, {
                where: {
                    id: companies.id,
                },
            })
        } else {
            await Companies.update({
                is_verified_company: false,
            }, {
                where: {
                    id: companies.id,
                },
            })
        }

        const response = await Companies.findOne({
            where: {
                id: companies.id,
            },
            include: [
                { model: LegalDocuments }
            ]
        });
        res.status(200).json({
            msg: 'Company Updated Successfuly',
            response,
        });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

const deleteCompanies = async (req, res) => {
    const company = await Companies.findOne({
        where: {
            id: req.params.id
        },
    });
    if (!company) return res.status(404).json({ msg: 'Companies Not Found' });
    try {
        await Companies.destroy({
            where: {
                id: company.id
            }
        });
        res.status(200).json({ msg: 'Delete Companies Success' });
    } catch (error) {
        res.status(400).json({ msg: error.messasge });
    }
}

module.exports = { getCompanies, getCompaniesById, createCompanies, updateCompanies, deleteCompanies }