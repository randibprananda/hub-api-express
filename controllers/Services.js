const PackagePricings = require("../models/PackagePricingsModel")
const EOServices = require("../models/EOServicesModel")
const EOImages = require("../models/EOImagesModel")
const ProductSupplies = require("../models/ProductSuppliesModel")
const ProductImages = require("../models/ProductImagesModel")
const TalentServices = require("../models/TalentServicesModel")
const TalentImages = require("../models/TalentImagesModel")
const VenueServices = require("../models/VenueServicesModel")
const VenueImages = require("../models/VenueImagesModel")
const Users = require("../models/UsersModel")
const Companies = require("../models/CompaniesModel")
const { Sequelize } = require("sequelize")
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Roles = require("../models/RolesModel")
const UsersDetail = require("../models/UsersDetailModel")
const base64Img = require('base64-img');

const GetServiceCategories = (req, res) => {
    try {
        const response = ["Event Organizer", "Venue", "Rental Alat", "Talent", "On Demand"]
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const SearchServices = async(req, res) => {
    try {
        const Op = Sequelize.Op

        let search = req.query.search || ""
        let category = req.query.category || "All"
        let minPriceFilter = req.query.minPriceFilter || "0"
        let maxPriceFilter = req.query.maxPriceFilter || "1000000000000000"
        let locFilter = req.query.locFilter || "All"
        let locFilters = []

        const categoryOptions = [
            "EO",
            "PRODUCT",
            "TALENT",
            "VENUE",
        ]

        const locOptions = [
            "Nanggroe Aceh Darussalam",
            "Sumatera Utara",
            "Sumatera Selatan",
            "Sumatera Barat",
            "Bengkulu",
            "Riau",
            "Kepulauan Riau",
            "Jambi",
            "Lampung",
            "Bangka Belitung",
            "Kalimantan Barat",
            "Kalimantan Timur",
            "Kalimantan Selatan",
            "Kalimantan Tengah",
            "Kalimantan Utara",
            "Banten",
            "DKI Jakarta",
            "Jawa Barat",
            "Jawa Tengah",
            "Daerah Istimewa Yogyakarta",
            "Jawa Timur",
            "Sulawesi Barat",
            "Sulawesi Tengah",
            "Sulawesi Utara",
            "Sulawesi Tenggara",
            "Sulawesi Selatan",
            "Maluku Utara",
            "Maluku",
            "Papua Barat",
            "Papua",
            "Papua Tengah",
            "Papua Pegunungan",
            "Papua Selatan",
            "Papua Barat Daya",
        ]

        category === "All" ? (category = [...categoryOptions]) : (category = req.query.category.split(","))
        locFilter === "All" ? (locFilters = [...locOptions]) : (locFilters = req.query.locFilter.split(","))

        if (locFilter === "All") {
            const eoServices = await EOServices.findAll({
                attributes: [
                    "id",
                    "name",
                    "userId"
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: EOImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('eo_services.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('eo_services.description')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const venueServices = await VenueServices.findAll({
                attributes: [
                    "id",
                    "name",
                    "userId"
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: VenueImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('venue_services.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('venue_services.description')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const productSupplies = await ProductSupplies.findAll({
                attributes: [
                    "id",
                    "tool_type",
                    "brand",
                    "model",
                    "userId",
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: ProductImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.tool_type')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.brand')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.model')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.condition')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const talentServices = await TalentServices.findAll({
                attributes: [
                    "id",
                    "name",
                    "userId",
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: TalentImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.skill')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.skill_description')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.certification')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.address')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const response = {
                search,
                category,
                locFilters,
                services: [
                    { eoServices: eoServices },
                    { venueServices: venueServices },
                    { productSupplies: productSupplies },
                    { talentServices: talentServices },
                ],
            }

            res.status(200).json(response)
        } else {
            const eoServices = await EOServices.findAll({
                attributes: [
                    "id",
                    "name",
                    "userId"
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: EOImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('eo_services.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('eo_services.description')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.col('user.company.province'), {
                                [Op.in]: [...locFilters],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const venueServices = await VenueServices.findAll({
                attributes: [
                    "id",
                    "name",
                    "userId"
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: VenueImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('venue_services.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('venue_services.description')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.col('user.company.province'), {
                                [Op.in]: [...locFilters],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const productSupplies = await ProductSupplies.findAll({
                attributes: [
                    "id",
                    "tool_type",
                    "brand",
                    "model",
                    "userId",
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: ProductImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.tool_type')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.brand')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.model')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('product_supplies.condition')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.col('user.company.province'), {
                                [Op.in]: [...locFilters],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const talentServices = await TalentServices.findAll({
                attributes: [
                    "id",
                    "name",
                    "userId",
                ],
                include: [{
                        model: Users,
                        attributes: [
                            "id",
                            "fullname",
                            "username",
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                "id",
                                "name",
                                "province",
                            ],
                        }],
                    },
                    {
                        model: TalentImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            "id",
                            "name",
                            "price",
                            "disc_percentage",
                            "total_price",
                            "service_type",
                        ],
                    },
                ],
                where: {
                    active: true,
                    [Op.and]: [{
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.skill')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.skill_description')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.certification')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('talent_services.address')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.username')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('user.fullname')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                        [Op.and]: [
                            Sequelize.where(Sequelize.col('user.company.province'), {
                                [Op.in]: [...locFilters],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.service_type')), {
                                [Op.in]: [...category],
                            }),
                            Sequelize.where(Sequelize.fn('lower', Sequelize.col('package_pricings.total_price')), {
                                [Op.between]: [parseInt(minPriceFilter), parseInt(maxPriceFilter)],
                            }),
                        ],
                    }, ],
                }
            })

            const response = {
                search,
                category,
                locFilters,
                services: [
                    { eoServices: eoServices },
                    { venueServices: venueServices },
                    { productSupplies: productSupplies },
                    { talentServices: talentServices },
                ],
            }

            res.status(200).json(response)
        }
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const GetServiceDetails = async(req, res) => {
    try {
        const serviceId = req.params["id"]
        const serviceType = req.params["service_type"]

        if (serviceType === "EO") {
            const eoService = await EOServices.findOne({
                where: {
                    id: serviceId,
                    active: true,
                },
                include: [{
                        model: EOImages,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: Users,
                        include: [{
                            model: Companies,
                        }, ],
                    },
                ],
            })

            const packagePricing = await PackagePricings.findAll({
                where: {
                    eoServiceId: serviceId,
                },
            })

            if (!eoService) {
                res.status(404).json({ msg: `EO service with id [${serviceId}] not found` })
            } else {
                if (packagePricing.length !== 0) {
                    const response = {
                        serviceId,
                        serviceType,
                        eoService,
                        packagePricing,
                    }

                    res.status(200).json(response)

                } else {
                    res.status(404).json({ msg: `Package pricing for EO service with id [${serviceId}] is empty` })
                }
            }
        } else if (serviceType === "PRODUCT") {
            const productSupply = await ProductSupplies.findOne({
                where: {
                    id: serviceId,
                    active: true,
                },
                include: [{
                        model: ProductImages,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: Users,
                        include: [{
                            model: Companies,
                        }, ],
                    },
                ],
            })

            const packagePricing = await PackagePricings.findAll({
                where: {
                    productSupplyId: serviceId,
                },
            })

            if (!productSupply) {
                res.status(404).json({ msg: `Product supply with id [${serviceId}] not found` })
            } else {
                if (packagePricing.length !== 0) {
                    const response = {
                        serviceId,
                        serviceType,
                        productSupply,
                        packagePricing,
                    }

                    res.status(200).json(response)

                } else {
                    res.status(404).json({ msg: `Package pricing for Product Supply with id [${serviceId}] is empty` })
                }
            }
        } else if (serviceType === "TALENT") {
            const talentService = await TalentServices.findOne({
                where: {
                    id: serviceId,
                    active: true,
                },
                include: [{
                        model: TalentImages,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: Users,
                        include: [{
                            model: Companies,
                        }, ],
                    },
                ],
            })

            const packagePricing = await PackagePricings.findAll({
                where: {
                    talentServiceId: serviceId,
                },
            })

            if (!talentService) {
                res.status(404).json({ msg: `Talent Service with id [${serviceId}] not found` })
            } else {
                if (packagePricing.length !== 0) {
                    const response = {
                        serviceId,
                        serviceType,
                        talentService,
                        packagePricing,
                    }

                    res.status(200).json(response)

                } else {
                    res.status(404).json({ msg: `Package pricing for Talent Service with id [${serviceId}] is empty` })
                }
            }
        } else if (serviceType === "VENUE") {
            const venueService = await VenueServices.findOne({
                where: {
                    id: serviceId,
                    active: true,
                },
                include: [{
                        model: VenueImages,
                        attributes: [
                            "id",
                            "image",
                        ],
                    },
                    {
                        model: Users,
                        include: [{
                            model: Companies,
                        }, ],
                    },
                ],
            })

            const packagePricing = await PackagePricings.findAll({
                where: {
                    venueServiceId: serviceId,
                },
            })

            if (!venueService) {
                res.status(404).json({ msg: `Venue Service with id [${serviceId}] not found` })
            } else {
                if (packagePricing.length !== 0) {
                    const response = {
                        serviceId,
                        serviceType,
                        venueService,
                        packagePricing,
                    }

                    res.status(200).json(response)

                } else {
                    res.status(404).json({ msg: `Package pricing for Venue Service with id [${serviceId}] is empty` })
                }
            }
        } else {
            res.status(404).json({ msg: `serviceType with name [${serviceType}] not found` })
        }
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const CreateService = async(req, res) => {
    try {

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({ where: { id: tokenDecode.userId } });
        const verified_at = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);


        const detectRole = await Users.findOne({
            where: {
                companyId: user.companyId,
                roleId: req.body.roleId
            }
        });

        const roleName = await Roles.findOne({
            where: {
                id: req.body.roleId
            }
        })
        

        const email = await Users.findOne({
            where: {
                email: req.body.email,
            }
        });
        const username = await Users.findOne({
            where: {
                username: req.body.username,
            }
        });

        if (email) {
            return res.status(404).json({ msg: "Email already exist" });
        } else if (username) {
            return res.status(404).json({ msg: "Username already exist" });
        } else if (detectRole) {
            return res.status(404).json({ msg: roleName.name+ " " + "already exist" });
        }else {
            const { fullname, username, email, phone, roleId, image } = req.body;
            try {
                base64Img.img(image, `./assets/images/profile/`, `konect-image-${Date.now()}`, async function(err, filepath) {
                    const newUser = new Users({
                        fullname: fullname,
                        username: username,
                        email: email,
                        phone: phone,
                        password: hash,
                        image: `/${filepath}`,
                        adminId: user.id,
                        companyId: user.companyId,
                        roleId: roleId,
                        verified_at: verified_at
                    });
                    const saveUser = await newUser.save()

                    const newUserDetail = new UsersDetail({
                        city: null,
                        province: null,
                        postal_code: null,
                        address: null,
                        userId: saveUser.id
                    });
                    const saveUserDetail = await newUserDetail.save();

                    const response = await Users.findOne({
                        where: {
                            id: newUser.id
                        },
                        include: [
                            { model: Roles, attributes: ['id', 'name'] },
                            { model: UsersDetail },
                            { model: Companies }
                        ]
                    });
                    res.status(201).json({ response });
                })

            } catch (error) {
                res.status(500).json({ msg: error.message })
            }
        }
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
}

module.exports = { GetServiceCategories, CreateService, SearchServices, GetServiceDetails, }