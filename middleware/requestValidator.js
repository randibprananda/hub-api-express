const { check, validationResult } = require('express-validator')

const {
    validatePhoneNumber,
    validateEmail,
} = require('../utils/regexValidator')


function EditVenueRequestValidator() {
    return [
        check('venue_name').notEmpty(),
        check('venue_description').notEmpty(),
        check('venue_spesification').notEmpty(),
        check('venue_images_base64').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function EditEORequestValidator() {
    return [
        check('eo_name').notEmpty(),
        check('eo_description').notEmpty(),
        check('eo_spesification').notEmpty(),
        check('eo_images_base64').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function EditProductRequestValidator() {
    return [
        check('product_name').notEmpty(),
        check('product_description').notEmpty(),
        check('product_spesification').notEmpty(),
        check('images').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function EditTalentRequestValidator() {
    return [
        check('talent_name').notEmpty(),
        check('deskripsiLayanan').notEmpty(),
        check('spesifikasiLayanan').notEmpty(),
        check('talent_images_base64').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function CreateEORequestValidator() {
    return [
        check('eo_name').notEmpty(),
        check('eo_description').notEmpty(),
        check('eo_spesification').notEmpty(),
        check('eo_images').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function CreateVenueRequestValidator() {
    return [
        check('venue_name').notEmpty(),
        check('venue_description').notEmpty(),
        check('venue_spesification').notEmpty(),
        check('images').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function CreateProductRequestValidator() {
    return [
        check('product_namaLayanan').notEmpty(),
        check('product_deskripsiLayanan').notEmpty(),
        check('product_spesifikasiLayanan').notEmpty(),
        check('images').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function CreateTalentRequestValidator() {
    return [
        check('talent_name').notEmpty(),
        check('deskripsiLayanan').notEmpty(),
        check('spesifikasiLayanan').notEmpty(),
        check('images').notEmpty(),
        check('package_price_type')
            .notEmpty()
            .withMessage(`package_price_type can't be empty`)
            .isIn(['FIXED', 'RANGE'])
            .withMessage(`package_price_type can only contain 'FIXED' or 'RANGE'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function RegisterRequestValidator() {
    return [
        check('fullname').notEmpty().withMessage("fullname can't be Empty !"),
        check('username').notEmpty().withMessage("username can't be Empty !"),
        check('email').notEmpty().withMessage("email can't be Empty !").isEmail().withMessage("email must be format email '@'"),
        check('password').notEmpty().withMessage("password can't be Empty !"),
        check('roleId').notEmpty().withMessage("roleId can't be Empty !"),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function AddBannerRequestValidator() {
    return [
        check('name').notEmpty(),
        check('banner_type')
            .notEmpty()
            .withMessage(`banner_type can't be empty`)
            .isIn(['BESAR', 'SLIDE'])
            .withMessage(`banner_type can only contain 'BESAR' or 'SLIDE'`),
        check('banner_order').notEmpty(),
        check('banner_images').notEmpty(),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function EditBannerRequestValidator() {
    return [
        check('name').notEmpty(),
        check('banner_type')
            .notEmpty()
            .withMessage(`banner_type can't be empty`)
            .isIn(['BESAR', 'SLIDE'])
            .withMessage(`banner_type can only contain 'BESAR' or 'SLIDE'`),
        check('banner_order').notEmpty(),
        check('banner_images').notEmpty(),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function EditServiceHighlightRequestValidator() {
    return [
        check('highlight')
            .notEmpty()
            .withMessage(`highlight can't be empty`)
            .isIn(['TERLARIS', 'TERBARU'])
            .withMessage(`highlight can only contain 'TERLARIS' or 'TERBARU'`),
        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            return next()
        },
    ]
}

function EditCompanyRequestValidator() {
    return [
        // check('name').notEmpty(),
        check('email')
            .isEmail()
            .withMessage('Email tidak valid.'),
        check('phone')
            .optional({ nullable: true, checkFalsy: true })
            .isNumeric().withMessage('Phone Must be Number')
            .isLength({ min: 10, max: 14 }).withMessage('Length Phone must be 10 - 14 Number !'),
            // .isMobilePhone(['id-ID'])
            // .withMessage(`The variable phone must contain numbers, start with 0 or 62, and have a length of 10 to 15 digits (example: 081111111111 or 6281111111111).`),
        // check('address').notEmpty(),
        // check('pic_name').notEmpty(),
        check('pic_email')
            .optional({ nullable: true, checkFalsy: true })
            .isEmail().withMessage('Email tidak valid.'),
        check('pic_phone')
            .optional({ nullable: true, checkFalsy: true })
            .isNumeric().withMessage('Phone Must be Number')
            .isLength({ min: 10, max: 14 }).withMessage('Length Phone must be 10 - 14 Number !'),
            // .isMobilePhone(['id-ID'])
            // .withMessage(`The variable pic_phone must contain numbers, start with 0 or 62, and have a length of 10 to 15 digits (example: 081111111111 or 6281111111111).`),
        check('website_url')
            .optional({ nullable: true, checkFalsy: true })
            .isURL().withMessage('website url Must be url'),
        // check('marketplace_url')
        //     .optional({ nullable: true, checkFalsy: true })
        //     .isURL(),

        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    request_body: req.body,
                })
            }

            return next()
        },
    ]
}

function CreateTenderRequestValidator() {
    return [
        check('title').notEmpty(),
        check('description').notEmpty(),
        check('partner_category').notEmpty(),
        check('maksimal_partner').notEmpty(),
        check('implementation_estimate').notEmpty(),
        check('deadline').notEmpty(),
        check('budget_target').notEmpty(),
        check('minimal_bidding').notEmpty(),
        check('participant_estimate').notEmpty(),
        check('tender_images').notEmpty(),

        (req, res, next) => {
            const result = validationResult(req)

            if (!result.isEmpty()) {
                return res.status(400).json({ middleware_validation: result.array() })
            }

            if (req.body.implementation_estimate < req.body.deadline) {
                return res.status(400).json({ message: 'implementation_estimate must be greater than or equal to deadline' })
            }

            return next()
        },
    ]
}

function createServiceValidator() {
    return [
        check('phone')
        .isNumeric().withMessage('Phone Must be Number !')
        .isLength({ min: 10, max: 13 }).withMessage('Length Phone must be 10 - 13 Number !'),
        check('email')
            .isEmail().withMessage('Email tidak valid.'),

        (req, res, next) => {
            const result = validationResult(req)
            
            if (!result.isEmpty()) {
                console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    request_body: req.body,
                })
            }

            return next()
        },
    ]
}
// validasi create bidding
function createBidValidate() {
    return [
        check('offering_letter')
            .custom((value, { req }) => {
            if (!req.files || !req.files.offering_letter) {
                    throw new Error('Offering Letter file is required');
                }
                const file = req.files.offering_letter;
                if (file.size > 1024 * 1024) {
                    throw new Error('Offering Letter file size should not exceed 1MB');
                }
                    return true;
            }),
        check('concept_presentation')
            .custom((value, { req }) => {
                if (!req.files || !req.files.concept_presentation) {
                    throw new Error('Concept Presentation file is required');
                }
                const file = req.files.concept_presentation;
                if (file.size > 1024 * 1024) {
                    throw new Error('Concept Presentation file size should not exceed 1MB');
                }
                    return true;
            }),
        check('budget_plan')
            .custom((value, { req }) => {
                if (!req.files || !req.files.budget_plan) {
                    throw new Error('Budget Plan file is required');
                }
                const file = req.files.budget_plan;
                if (file.size > 1024 * 1024) {
                    throw new Error('Budget Plan file size should not exceed 1MB');
                }
                    return true;
            }),
        check('bidding')
            .notEmpty().withMessage("Bidding Can't Empty !")
            .isNumeric().withMessage('Bidding Must be Number !'),
        
        (req, res, next) => {
            const result = validationResult(req)
            // console.log(req)
            if (!result.isEmpty()) {
                // console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    request_body: req.body,
                })
            }

            return next()
        },
    ]
}

function createArticleValidator() {
    return [
        check('title_article')
        .notEmpty().withMessage("title article can't be Empty !"),
        check('writers_name')
        .notEmpty().withMessage("writers name can't be Empty !"),
        check('contents_article')
        .notEmpty().withMessage("contents article can't be Empty !"),
        check('categories')
        .notEmpty().withMessage("categories can't be Empty !"),

        (req, res, next) => {
            const result = validationResult(req)
            console.log(result)
            if (!result.isEmpty()) {
                // console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    // request_body: req.body,
                })
            }

            return next()
        },
    ]
}

function loginValidator() {
    return [
        check('username')
        .notEmpty().withMessage("username can't be Empty !"),
        check('password')
        .notEmpty().withMessage("password can't be Empty !"),

        (req, res, next) => {
            const result = validationResult(req)
            console.log(result)
            if (!result.isEmpty()) {
                // console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    // request_body: req.body,
                })
            }

            return next()
        },
    ]
}

function loginFairbaseValidator() {
    return [
        check('email')
        .notEmpty().withMessage("email can't be Empty !")
        .isEmail().withMessage("email must be format email '@'"),

        (req, res, next) => {
            const result = validationResult(req)
            console.log(result)
            if (!result.isEmpty()) {
                // console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    // request_body: req.body,
                })
            }
            return next()
        },
    ]
}

function ConfirmVerifiCodeValidor() {
    return [
        check('username')
        .notEmpty().withMessage("username can't be Empty !"),
        check('verification_code')
        .notEmpty().withMessage("verification_code can't be Empty !"),

        (req, res, next) => {
            const result = validationResult(req)
            console.log(result)
            if (!result.isEmpty()) {
                // console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    // request_body: req.body,
                })
            }
            return next()
        },
    ]
}

function ResetPasswordValidator() {
    return [
        check('password')
        .notEmpty().withMessage("password can't be Empty !"),
        check('confirmPassword')
        .notEmpty().withMessage("confirmPassword can't be Empty !"),

        (req, res, next) => {
            const result = validationResult(req)
            console.log(result)
            if (!result.isEmpty()) {
                // console.log(result.array())
                // return res.status(400).json({ middleware_validation: result.array() })
                return res.status(400).json({
                    middleware_validation: result.array(),
                    // request_body: req.body,
                })
            }
            return next()
        },
    ]
}

module.exports = {
    EditVenueRequestValidator,
    EditEORequestValidator,
    EditProductRequestValidator,
    EditTalentRequestValidator,
    CreateEORequestValidator,
    CreateVenueRequestValidator,
    CreateProductRequestValidator,
    CreateTalentRequestValidator,
    RegisterRequestValidator,
    AddBannerRequestValidator,
    EditBannerRequestValidator,
    EditServiceHighlightRequestValidator,
    EditCompanyRequestValidator,
    CreateTenderRequestValidator,
    createServiceValidator,
    createBidValidate,
    createArticleValidator,
    loginValidator,
    loginFairbaseValidator,
    ConfirmVerifiCodeValidor,
    ResetPasswordValidator,
}