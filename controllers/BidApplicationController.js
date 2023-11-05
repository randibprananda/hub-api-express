const jwt  = require("jsonwebtoken")
const BidApplicant = require('../models/BidApplicantModels')
const Roles = require('../models/RolesModel')
const Users = require('../models/UsersModel')
const { storePDFToDirectory, generatePDFNameAndPath } = require("../controllers/PDFController")

class BidApplicantController {
    static async createBid (req,res){
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if(error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId
            },
            include: {
                model: Roles
            }
        })
        try {
            if(user.dataValues.role.dataValues.name == 'Partner'){
                const offering_letter = req.files.offering_letter
                const concept_presentation = req.files.concept_presentation
                const budget_plan = req.files.budget_plan
                const directory = []
                    
                if(offering_letter){
                    const category = "offering_letter"
                    const { fileName, filePath } = generatePDFNameAndPath(offering_letter, category)
                    storePDFToDirectory(offering_letter, filePath, res)
                    
                    directory.push(`/assets/BidApp/offering_letter/${fileName}`)
                }
                if(concept_presentation){
                    const category = "concept_presentation"
                    const { fileName, filePath } = generatePDFNameAndPath(concept_presentation, category)
                    storePDFToDirectory(concept_presentation, filePath, res)
                    
                    directory.push(`/assets/BidApp/concept_presentation/${fileName}`)
                }
                if(budget_plan){
                    const category = "budget_plan"
                    const { fileName, filePath } = generatePDFNameAndPath(budget_plan, category)
                    storePDFToDirectory(budget_plan, filePath, res)
                    
                    directory.push(`/assets/BidApp/budget_plan/${fileName}`)
                }
                // console.log(directory)
                await BidApplicant.create({
                    bidding: req.body.bidding,
                    tenderRequestId: req.body.tenderRequestId,
                    offering_letter : directory[0],
                    concept_presentation : directory[1],
                    budget_plan : directory[2],
                    partnerId: tokenDecode.userId
                })
                .then((createBid)=>{
                    res.status(201).json({
                        data: createBid
                    })
                })
            }else{
                res.status(500).json({
                    message: "Your role does not have this access!"
                })
            }

        } catch (error) {
            if(error.errors){
                res.status(500).json({
                    message: error.errors[0].message
                })
            }else{
                res.status(500).json({
                    message: error.message
                })
            }
        }
    }
}

module.exports = BidApplicantController