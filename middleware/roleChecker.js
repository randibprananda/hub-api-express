const Users = require('../models/UsersModel')
const Roles = require('../models/RolesModel')

const jwt = require("jsonwebtoken")


// Middleware for making sure the user's role accessed the endpoint is Admin
async function IsAdmin(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Admin') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Stakeholder
async function IsStakeholder(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Stakeholder') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Event Organizer
async function IsEO(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Event Organizer') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Venue
async function IsVenue(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Venue') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Event Hunter
async function IsEventHunter(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Event Hunter') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Partner
async function IsPartner(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Partner') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Supplier
async function IsSupplier(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Supplier') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

// Middleware for making sure the user's role accessed the endpoint is Talent
async function IsTalent(req, res, next) {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: {
                model: Roles,
            },
        })

        if (user.role.name !== 'Talent') {
            return res.status(403).json({ msg: `Your role is not allowed!` })
        } else {
            next()
        }
    } catch (error) {
        return res.status(500).json({ msg: `roleChecker:\n ${error.message}` })
    }
}

module.exports = { IsAdmin, IsStakeholder, IsEO, IsVenue, IsEventHunter, IsPartner, IsSupplier, IsTalent }