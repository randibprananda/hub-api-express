const TenderRequests = require('../models/TenderRequestsModel')
const Transactions = require('../models/TransactionsModel')

const { Op } = require("sequelize")


const isActiveTenderChecker = async () => {
   try {
      console.log("isActive checker for Tenders is running.")

      const before = await TenderRequests.count({
         where: {
            deadline: {
               [Op.lt]: new Date(),
            },
            is_active: 1,
         },
      })

      // bikin otomatis cek buat yg masih aktif

      await TenderRequests.update(
         { is_active: 0 },
         {
            where: {
               deadline: {
                  [Op.lt]: new Date(),
               },
               is_active: 1,
            },
         },
      )

      var count = 0
      if (before) count = before

      console.log(`There are [${count}] tender(s) passed the deadline.`)
   } catch (error) {
      console.log("isActive checker for Tenders is failed to run.")
      console.log(error)
   }
}

const isActiveTransactionChecker = async () => {
   try {
      console.log("isActive checker for Transactions is running.")

      const before = await Transactions.count({
         where: {
            endDate: {
               [Op.lt]: new Date(),
            },
            status: `UNPAID`,
         },
      })

      await TenderRequests.update(
         { status: 'FAILED' },
         {
            where: {
               endDate: {
                  [Op.lt]: new Date(),
               },
               status: `UNPAID`,
            },
         },
      )

      var count = 0
      if (before) count = before

      console.log(`There are [${count}] transaction(s) passed the deadline.`)
   } catch (error) {
      console.log("isActive checker for Transactions is failed to run.")
      console.log(error)
   }
}

module.exports = { isActiveTenderChecker, isActiveTransactionChecker }