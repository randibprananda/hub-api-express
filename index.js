const express = require("express");
const sitemap = require("express-sitemap-html");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");
var cron = require("node-cron");

const db = require("./config/Database.js");
const UsersRoute = require("./routes/UsersRoute.js");
const RolesRoute = require("./routes/RolesRoute.js");
const AuthRoute = require("./routes/AuthRoute.js");
const CompaniesRoute = require("./routes/CompaniesRoute.js");
const LegalDocuments = require("./routes/LegalDocuments.js");
const VenueRoute = require("./routes/VenueRoute.js");
const TalentRoute = require("./routes/TalentRoute.js");
const ProductSupplyRoute = require("./routes/ProductSuppliesRoute.js");
const EventOrganizerRoute = require("./routes/EventOrganizerRoute.js");
const EventHunterRoute = require("./routes/EventHunterRoute.js");
const Stakeholder = require("./routes/StakeholderRoute.js");
const TransactionRoute = require("./routes/TransactionRoute.js");
const PartnerRoute = require("./routes/PartnerRoute.js");
const ServicesRoute = require("./routes/ServicesRoute.js");
const TenderRoute = require("./routes/TenderRoute.js");
const BidApplicationRoute = require("./routes/BidApplicationRoute.js");
const ProfileRoute = require("./routes/ProfileRoute.js");
const AdminKonectRoute = require("./routes/AdminKonectRoute.js");
const ShopDecorationRoute = require("./routes/ShopDecorationRoute.js");

const PeriodicChecker = require("./utils/periodicChecker.js");
const { ShopDecorationChecker } = require("./utils/ShopDecorationChecker.js");
const DatabaseChecker = require("./utils/databaseChecker.js");
const Roles = require("./models/RolesModel.js");
const generateRolesAutomatic = require("./seeders/generateRolesAutomatic.js");
const generateAdminAutomatic = require("./seeders/generateAdminAutomatic.js");

dotenv.config();

const app = express();

app.get("/sitemap", sitemap(app));

sitemap.swagger("konect", app);

// (async() => {
//     await db.sync({ alter: true });
//     const role = await Roles.findAll()
//     if( role.length == 0 ){
//         generateRolesAutomatic(),
//         generateAdminAutomatic()
//     }
// })();

app.use(
  session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: "auto",
    },
  }),
);

app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "https://www.hub.konect.id", "https://hub.konect.id"],
  }),
);

// app.use(express.json())
app.use(bodyParser.json({ limit: "100mb" }));
app.use(fileUpload());
app.use("/assets", express.static(path.join(__dirname, "./assets")));

app.use(UsersRoute);
app.use(RolesRoute);
app.use(AuthRoute);
app.use(CompaniesRoute);
app.use(LegalDocuments);
app.use(VenueRoute);
app.use(TalentRoute);
app.use(ProductSupplyRoute);
app.use(EventOrganizerRoute);
app.use(EventHunterRoute);
app.use(Stakeholder);
app.use(TransactionRoute);
app.use(ServicesRoute);
app.use(PartnerRoute);
app.use(TenderRoute);
app.use(BidApplicationRoute);
app.use(ProfileRoute);
app.use(AdminKonectRoute);
app.use(ShopDecorationRoute);

(async () => {
  // function scheduler running every day at 00.01
  cron.schedule("1 0 * * *", function () {
    PeriodicChecker.isActiveTenderChecker();
    PeriodicChecker.isActiveTransactionChecker();
  });

  // PeriodicChecker.isActiveTenderChecker()
  // PeriodicChecker.isActiveTransactionChecker()
  // ShopDecorationChecker()

  DatabaseChecker.addOnsChecker();
})();

app.listen(process.env.APP_PORT, () => {
  console.log("Server Running", process.env.APP_PORT);
});
