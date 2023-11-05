const Companies = require("../models/CompaniesModel.js");
const LegalDocuments = require("../models/LegalDocumentsModel.js");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

const getLegalDocuments = async (req, res) => {

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        return decoded
    })

    try {
        const response = await LegalDocuments.findAll({
            include: [
                {model: Companies, attributes: ['id', 'name']},
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getLegalDocumentsById = async (req, res) => {

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        return decoded
    })

    try {
        const response = await LegalDocuments.findAll({
            where: {
                id: req.params.id
            },
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getLegalDocumentsByCompanyId = async (req, res) => {

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        return decoded
    })

    try {
        const response = await LegalDocuments.findAll({
            where: {
                companyId: req.params.companyId
            },
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const createLegalDocuments = async (req, res) => {

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        return decoded
    })

    const {type, document_identities, companyId} = req.body;
    if(req.files === null) {
        try {
            await LegalDocuments.create({
                path: null,
                type: type,
                document_identities: document_identities,
                companyId: companyId
            });
            res.status(201).json({ msg: 'Create Legal Documents Success' });
        } catch (error) {
            res.status(400).json({ msg: 'Data cannot be blank' });
        }
    } else {
        try {
            const {type, document_identities, companyId} = req.body;
            const file = req.files.path;
            const fileSize = file.data.length;
            const extFile = path.extname(file.name);
            fileName = file.md5 + extFile;
            if(fileSize > 5000000) return res.status(422).json({msg: "File must be less than 5 MB"});
            file.mv(`./assets/file/companyFile/${fileName}`, (err)=>{
                if(err) return res.status(500).json({msg: err.message});
            });
            const paths = `/assets/file/companyFile/${fileName}`;
            await LegalDocuments.create({
                path: paths,
                type: type,
                document_identities: document_identities,
                companyId: companyId
            });
            res.status(201).json({ msg: 'Create Legal Documents Success' });
        } catch (error) {
            res.status(400).json({ msg: 'Data cannot be blank' });
        }
    }
}

const updateLegalDocuments = async (req, res) => {
    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        return decoded
    })
    
    const documents = await LegalDocuments.findOne({
        where: {
            id: req.params.id
        },
    });

    if(!documents) return res.status(404).json({ msg: 'Legal Documents Not Found' });

    let fileName = '';

    if (!req?.files?.path) {
        try {
            const {type, document_identities, companyId} = req.body;
            await LegalDocuments.update({
                path: documents.path,
                type: type,
                document_identities: document_identities,
                companyId: companyId
            },{
                where: {
                    id: documents.id
                }
            });
            res.status(201).json({ msg: 'Document successfully updated' });
        } catch (error) {
            res.status(400).json({ msg: error.messasge });
        }
    }else {
        const file = req.files.path;
        const fileSize = file.data.length;
        const extFile = path.extname(file.name);
        fileName = file.md5 + extFile;

        if(fileSize > 5000000) return res.status(422).json({msg: "File must be less than 5 MB"});
        if(documents.path === null) {
            file.mv(`./assets/file/companyFile/${fileName}`, (err)=>{
                if(err) return res.status(500).json({msg: err.message});
            });
        } else {
            const paths = `./assets/file/companyFile/konect-hub-${fileName}`;
            fs.unlinkSync(paths)
            file.mv(`./assets/file/companyFile/${fileName}`, (err)=>{
                if(err) return res.status(500).json({msg: err.message});
            });
        }
        try {
            const {type, document_identities, companyId} = req.body;
            const paths = `/assets/file/companyFile/${fileName}`;
            await LegalDocuments.update({
                path: paths,
                type: type,
                document_identities: document_identities,
                companyId: companyId
            },{
                where: {
                    id: documents.id
                }
            });
            res.status(201).json({ msg: 'Document successfully updated' });
        } catch (error) {
            res.status(400).json({ msg: error.messasge });
        }
    }
}

const deleteLegalDocuments = async (req, res) => {

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if(error) return res.sendStatus(403);
        return decoded
    })

    const documents = await LegalDocuments.findOne({
        where: {
            id: req.params.id
        },
    });
    if(!documents) return res.status(404).json({ msg: 'Legal Documents Not Found' });
    try {
        await LegalDocuments.destroy({
            where: {
                id: documents.id
            }
        });
        res.status(200).json({ msg: 'Delete Legal Documents Success' });
    } catch (error) {
        res.status(400).json({ msg: error.messasge });
    }
}

module.exports = { getLegalDocuments, getLegalDocumentsById, getLegalDocumentsByCompanyId, createLegalDocuments, updateLegalDocuments, deleteLegalDocuments }