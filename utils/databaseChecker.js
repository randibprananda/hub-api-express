const TenderRequests = require("../models/TenderRequestsModel")

class DatabaseChecker {
    // dibikin otomatis cek add on yang nilainya masih string kosong lalu ubah ke null
    static async addOnsChecker() {
        try {
            console.log("Tender's Add On Checker is running")
            
            const updatedTender = await TenderRequests.update(
                {
                    add_on: null,
                },
                {
                    where: {
                        add_on: "",
                    },
                },
            )

            console.log(`Success to updating ${updatedTender} tender's add on in database!`)
        } catch (error) {
            console.log(`Failed to checking add ons!\nError: ${error}`)
        }
    }
}

module.exports = DatabaseChecker