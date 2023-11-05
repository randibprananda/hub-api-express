const jwt = require("jsonwebtoken");
const Companies = require("../models/CompaniesModel");
const EOServices = require("../models/EOServicesModel");
const PackagePricings = require("../models/PackagePricingsModel");
const ProductSupplies = require("../models/ProductSuppliesModel");
const TalentServices = require("../models/TalentServicesModel");
const Transactions = require("../models/TransactionsModel");
const Users = require("../models/UsersModel");
const VenueServices = require("../models/VenueServicesModel");
const { constants } = require("fs/promises");
const EOImages = require("../models/EOImagesModel");
const VenueImages = require("../models/VenueImagesModel");
const TalentImages = require("../models/TalentImagesModel");
const ProductImages = require("../models/ProductImagesModel");

const getBookingService = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if(error) return res.sendStatus(403);
            return decoded
        })

        const limit = 10; // jumlah data per halaman
        const page = parseInt(req.query.page) || 1; // halaman yang diminta (default: 1)
        const offset = (page - 1) * limit; // offset untuk query

        const booking = await Transactions.findAndCountAll({
            where: {
                clientId: tokenDecode.userId,
                // status: 'PAID',
                // service_status: 'INCOMPLETE'
            },
            include: {
                model: PackagePricings,
                include: [{
                    model: EOServices,
                    include: {
                        model: EOImages,
                    },
                },{
                    model: VenueServices,
                    include: {
                        model: VenueImages,
                    },
                },{
                    model: TalentServices,
                    include: {
                        model: TalentImages,
                    },
                },{
                    model: ProductSupplies,
                    include: {
                        model: ProductImages,
                    },
                }]
            },
            limit,
            offset,
        })


        const statistic = {
            booking: booking.count,
        }

        const totalPages = Math.ceil(booking.count / limit);

        return res.status(200).json({
            data: booking.rows,
            statistic,
            pagination: {
                currentPage: page,
                totalPages,
            }
        });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}




const getFinishedService = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if(error) return res.sendStatus(403);
            return decoded
        })

        const limit = 10; // jumlah data per halaman
        const page = parseInt(req.query.page) || 1; // halaman yang diminta (default: 1)
        const offset = (page - 1) * limit; // offset untuk query


        const finish = await Transactions.findAll({
            where: {
                clientId: tokenDecode.userId,
                status: 'COMPLETE',
                // service_status: 'COMPLETE'
            },
            include: {
                model: PackagePricings,
                include: [{
                    model: EOServices,
                    include: {
                        model: EOImages,
                    },
                },{
                    model: VenueServices,
                    include: {
                        model: VenueImages,
                    },
                },{
                    model: TalentServices,
                    include: {
                        model: TalentImages,
                    },
                },{
                    model: ProductSupplies,
                    include: {
                        model: ProductImages,
                    },
                }]
            },
            limit,
            offset,
        })


        const statistic = {
            finish: finish.length,
        }

        const totalPages = Math.ceil(finish.count / limit);


        return res.status(200).json({
            data: finish,
            statistic,
            pagination : {
                currentPage:page,
                totalPages,
            }
        });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}




const getAllService = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if(error) return res.sendStatus(403);
            return decoded
        })

        const limit = 10;//jumlah data per halaman
        const page = parseInt(req.query.page)||1;
        const offset = (page-1) * limit;//offset untuk query

        

        const all = await Transactions.findAll({
            where: {
                clientId: tokenDecode.userId,
            },
            include: {
                model: PackagePricings,
                include: [{
                    model: EOServices,
                    include: {
                        model: EOImages,
                    },
                },{
                    model: VenueServices,
                    include: {
                        model: VenueImages,
                    },
                },{
                    model: TalentServices,
                    include: {
                        model: TalentImages,
                    },
                },{
                    model: ProductSupplies,
                    include: {
                        model: ProductImages,
                    },
                }]
            },
            limit,
            offset,
        })

        const statistic = {
            all: all.length,
        }

        const totalPages  = Math.ceil(all.count/limit);

        return res.status(200).json({
            data: all,
            statistic,
            pagination : {
                currentPage:page,
                totalPages,
            }
        });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getServiceById = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if(error) return res.sendStatus(403);
            return decoded
        })

        const transaction = await Transactions.findOne({
            where: {
                id: req.params.id
            },
            include: {
                model: PackagePricings,
                include: [{
                    model: EOServices,
                    include: {
                        model: Users,
                        include: {
                            model: Companies
                        }
                    }
                },{
                    model: VenueServices,
                },{
                    model: TalentServices,
                },{
                    model: ProductSupplies,
                }]
            }
        })

        return res.status(200).json(transaction);
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getHistoryStatService = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if(error) return res.sendStatus(403);
            return decoded
        })


        const booking = await Transactions.findAndCountAll({
            where: {
                clientId: tokenDecode.userId,
                // status: 'SUCCESS',
                // service_status: 'INCOMPLETE'
                status: 'PAID',
            },
            include: {
                model: PackagePricings,
                include: [{
                model: EOServices,
                },{
                    model: VenueServices,
                },{
                    model: TalentServices,
                },{
                    model: ProductSupplies,
                }]
            },
            
        })

        const finish = await Transactions.findAndCountAll({
            where: {
                clientId: tokenDecode.userId,
                // status: 'SUCCESS',
                // service_status: 'COMPLETE'
                status: 'COMPLETE',
            },
            include: {
                model: PackagePricings,
                include: [{
                    model: EOServices,
                },{
                    model: VenueServices,
                },{
                    model: TalentServices,
                },{
                    model: ProductSupplies,
                }]
            },
          
        })

        const all = await Transactions.findAndCountAll({
            where: {
                clientId: tokenDecode.userId,
            },
            include: {
                model: PackagePricings,
                include: [{
                    model: EOServices,
                },{
                    model: VenueServices,
                },{
                    model: TalentServices,
                },{
                    model: ProductSupplies,
                }]
            },
           
        })

        const statistic = {
            booking: booking.count,
            finish: finish.count,
            all: all.count,
        }


        return res.status(200).json({
            data: booking.rows,
            statistic,
         
        });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}







module.exports = {getBookingService, getFinishedService, getAllService, getServiceById,getHistoryStatService}