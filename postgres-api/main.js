const express = require("express");
const { Client } = require("pg"); // Renamed PostgreSQL Client
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const nodemailer = require("nodemailer");
const qrcode = require("qrcode-terminal");
const cron = require('node-cron');
const moment = require('moment');
const { Client: WhatsappClient, LocalAuth } = require("whatsapp-web.js"); // Renamed WhatsApp Client

// Initialize WhatsApp on server start and scan QR code
const whatsapp = new WhatsappClient({
    authStrategy: new LocalAuth(),
});

whatsapp.on("qr", (qr) => {
    qrcode.generate(qr, { small: true }); // Corrected the method name to 'generate'
});

whatsapp.on("ready", () => {
    console.log("WhatsApp active: Success");
    console.log(new Date());

});

whatsapp.initialize(); // Corrected method name (initalize -> initialize)
module.exports = sendMail;

const app = express();
const port = 3002;

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views", "template"));

// Configure session middleware
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// Replace these credentials with your PostgreSQL server details
const dbConfig = {
    user: "postgres",
    host: "localhost",
    database: "kvardb",
    password: "abcd",
    port: 5432,
};

// Create a PostgreSQL client
const client = new Client(dbConfig);

// Connect to the PostgreSQL database
client
    .connect()
    .then(() => console.log("Connected to the database"))
    .catch((err) => console.error("Error connecting to the database", err));

   

// Login endpoint
app.post("/login", async(req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }

    try {
        const query = "SELECT * FROM employee WHERE username = $1";
        const result = await client.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const user = result.rows[0];

        if (password !== user.password) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        req.session.user = {
            id: user.department_id,
            name: user.employee_name, // Assuming column employee_name exists
        };

        // Check the department ID and redirect accordingly
        const departmentId = user.department_id; // Assuming column department_id exists

        if (departmentId === 8) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/dashboard",
                userId: user.id,
            });
        } else if (departmentId === 1) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/accounts-table/edit-accounts",
                userId: user.id,
            });
        } else if (departmentId === 2) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/sales-table/edit-sales",
                userId: user.id,
            });
        } else if (departmentId === 3) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/purchase-table/edit-purchase",
                userId: user.id,
            });
        } else if (departmentId === 4) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/stores-table/edit-stores",
                userId: user.id,
            });
        } else if (departmentId === 5) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/quality-table/edit-quality",
                userId: user.id,
            });
        } else if (departmentId === 6) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/production-table/edit-production",
                userId: user.id,
            });
        } else if (departmentId === 7) {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/rnd-table/edit-rnd",
                userId: user.id,
            });
        } else {
            res.status(200).json({
                message: "Login successful",
                redirectUrl: "/",
                userId: user.id,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

const apiRoutes = [
    "management_data",
    "sales_data",
    "rnd_data",
    "qc_data",
    "accounts_data",
    "production_data",
    "stores_data",
    "team_data",
    "test_data",
    "planning",
];

apiRoutes.forEach((route) => {
    app.get(`/api/${route}`, async(req, res) => {
        try {
            const result = await client.query(`SELECT * FROM ${route}`);
            res.json({ rows: result.rows });
        } catch (error) {
            console.error(`Error executing query for ${route}`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
});

// For Allerts send message "Department Priority"
const departmentContacts = {
    1: 67, // Sales
    2: 64, // Purchase
    3: 57, // Stores
    4: 66, // R&D
    5: 69, // Production
    6: 65, // QC
    7: 61, // Accounts
};

const departmentsTo = {
    1: "Sales", // Sales department
    2: "Purchase", // Purchase department
    3: "Stores", // Stores department
    4: "R&D", // Research and Development department
    5: "Production", // Production department
    6: "QC", // Quality Control department
    7: "Accounts", // Accounts department
};

const departmentsFrom = {
    1: "Accounts",
    2: "Sales",
    3: "Purchase",
    4: "Stores",
    5: "QC",
    6: "Production",
    7: "R&D",
};

// Function to get the employee's phone number based on department ID
async function getPhoneNumberByDepartment(departmentId) {
    const employeeId = departmentContacts[departmentId];

    if (!employeeId) {
        throw new Error("Invalid department ID");
    }

    try {
        const result = await client.query(
            "SELECT phone FROM employee WHERE id = $1", [employeeId]
        );

        if (result.rows.length === 0) {
            throw new Error("No matching employee found");
        }

        return result.rows[0].phone; // Return phone number
    } catch (err) {
        console.error("Error fetching employee phone number:", err);
        throw err;
    }
}

const createPushbackAlertMessage = (
    oaNumber,
    fgCode,
    fromDepartment,
    toDepartment,
    reason
) => {
    const sirenEmoji = "🚨"; // Siren emoji
    return (
        `${sirenEmoji}${sirenEmoji} Push Back Alert ${sirenEmoji}${sirenEmoji}\n\n` +
        `*OA Number*: ${oaNumber}\n` +
        `*FG Code*: ${fgCode}\n` +
        `Pushbacked from ${fromDepartment} to ${toDepartment} for the below reason:\n` +
        `*Reason*: ${reason}\n\n` +
        `Please check the issue, try to resolve it ASAP and update the StatusQue.`
    );
};

// --------------------------------------PARAMS READ-BACK QUERIES----------------------------------------------------------------  //
// Define the route to handle the AJAX request
app.put(
    "/api/pushback_status/:oaNumber/:itemCode/:departmentId",
    async(req, res) => {
        const { oaNumber, itemCode, departmentId } = req.params; // Extracting parameters from URL
        const { department, reasons } = req.body; // Extracting data from request body
        console.log("Push Back Received:", {
            oaNumber,
            itemCode,
            department,
            reasons,
            departmentId,
        });

        const fromDepartment = departmentsFrom[departmentId];
        const toDepartment = departmentsTo[department];

        const phoneNumber = await getPhoneNumberByDepartment(department);
        // console.log("Phone number:" , phoneNumber)
        const message = createPushbackAlertMessage(
            oaNumber,
            itemCode,
            fromDepartment,
            toDepartment,
            reasons
        );

        console.log("Message:", message);

        whatsapp
            .sendMessage(`${phoneNumber}@c.us`, message)
            .then((response) => {
                console.log("Message sent successfully:", response);
            })
            .catch((err) => {
                console.error("Error sending message:", err);
            });

        console.log("WhatsApp message is being sent...");

        try {
            // Update the stage and total_revert in team_data
            const result = await client.query(
                `UPDATE team_data 
          SET stage = $1, 
              total_revert = COALESCE(total_revert, 0) + 1
          WHERE oa_number = $2 AND item_code = $3`, [department, oaNumber, itemCode]
            );

            if (result.rowCount === 0) {
                return res
                    .status(404)
                    .json({ error: "No matching record found in team_data" });
            }

            // Switch based on departmentId to update the relevant table
            let updateRevertQuery = "";
            switch (parseInt(department)) {
                case 1: // Sales
                    updateRevertQuery = `UPDATE sales_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                case 2: // Purchase
                    updateRevertQuery = `UPDATE purchase_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                case 3: // Stores
                    updateRevertQuery = `UPDATE stores_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                case 4: // R&D
                    updateRevertQuery = `UPDATE rnd_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                case 5: // Production
                    updateRevertQuery = `UPDATE production_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                case 6: // QC
                    updateRevertQuery = `UPDATE qc_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                case 7: // Accounts
                    updateRevertQuery = `UPDATE accounts_data SET revert_for_me = COALESCE(revert_for_me, 0) + 1 WHERE oa_number = $1 AND item_code = $2`;
                    break;
                default:
                    return res.status(400).json({ error: "Invalid department ID" });
            }

            // Run the department-specific revert_for_me update query
            const departmentResult = await client.query(updateRevertQuery, [
                oaNumber,
                itemCode,
            ]);

            if (departmentResult.rowCount === 0) {
                return res.status(404).json({
                    error: "No matching record found in department-specific table",
                });
            }

            res.status(200).json({ message: "Pushback status updated successfully" });
        } catch (error) {
            console.error("Error updating pushback status:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

app.get(`/api/check/accounts_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    const itemCode = req.params.itemCode;

    try {
        // Query to get data from accounts_data
        const result = await client.query(
            `SELECT * FROM accounts_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }

        const data = result.rows[0];

        // Check if specific columns are null or not
        const GSTNumber = data.gst_number !== null;
        const StatutoryDetails = data.statutory_details !== null;
        const TermsOfPayment = data.terms_of_payment !== null;
        const AdvanceReceived = data.advance_received !== null;
        const Invoicing = data.invoicing !== null;

        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            GSTNumber,
            StatutoryDetails,
            TermsOfPayment,
            AdvanceReceived,
            Invoicing,
            notes,
            stageDescription, // Add stage description to the response
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for accounts_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(`/api/check/rnd_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    const itemCode = req.params.itemCode;
    try {
        const result = await client.query(
            `SELECT * FROM rnd_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }
        const data = result.rows[0];

        // Check if specific columns are null or not
        const SpeciCheck = data.specification_check !== null;
        const Bom = data.bom !== null;
        const RndComplete = data.rnd_complete !== null;
        const user_manual = data.user_manual;
        const storing_final_documents_in_folder =
            data.storing_final_documents_in_folder;
        const circuit_diagrams = data.circuit_diagrams;
        const testing_manual = data.testing_manual;
        const specification_check = data.specification_check;
        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            SpeciCheck,
            Bom,
            RndComplete,
            notes,
            user_manual,
            storing_final_documents_in_folder,
            circuit_diagrams,
            testing_manual,
            specification_check,
            stageDescription,
            // Add other properties if needed
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for rnd_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(`/api/check/sales_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    const itemCode = req.params.itemCode;
    try {
        const result = await client.query(
            `SELECT * FROM sales_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }
        const data = result.rows[0];

        // Check if specific columns are null or not
        const oaDate = data.oa_date;
        const itemcode = data.item_code;
        const orderqty = data.order_qty;
        const email = data.cust_email;
        const lateClause = data.late_clause;
        const soCheckWithQuotation = data.so_check_with_quotation !== null;
        const specCheck = data.specs_check !== null;
        const termsOfPayment = data.terms_of_payment !== null;
        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        const activeResult = await client.query(
            `SELECT status FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        const status = activeResult.rows[0].status;

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            oaDate,
            itemcode,
            orderqty,
            email,
            lateClause,
            soCheckWithQuotation,
            specCheck,
            termsOfPayment,
            notes,
            stageDescription,
            status,
            // Add other properties if needed
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for sales_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get('/api/check/search', async (req, res) => {
    const { oaNumber, customerName, itemCode, tableName } = req.query;

    try {
        // Construct dynamic query with optional filters
        let query = `
            SELECT DISTINCT oa_number, item_code 
            FROM ${tableName} 
            WHERE 1=1
        `;
        const params = [];
        
        if (oaNumber) {
            params.push(`%${oaNumber}%`);
            query += ` AND oa_number ILIKE $${params.length}`;
        }

        if (customerName) {
            params.push(`%${customerName}%`);
            query += ` AND customer_name ILIKE $${params.length}`;
        }

        if (itemCode) {
            params.push(`%${itemCode}%`);
            query += ` AND item_code ILIKE $${params.length}`;
        }

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No matching data found." });
        }

        // Return matching rows
        const resultCheck = res.json(result.rows);
        console.log(resultCheck);
    } catch (error) {
        console.error("Error fetching search data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(`/api/check/stores_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    const itemCode = req.params.itemCode;
    try {
        const result = await client.query(
            `SELECT * FROM stores_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }
        const data = result.rows[0];

        // Check if specific columns are null or not
        const stockCheck = data.stock_check !== null;
        const mip = data.m_i_p !== null;
        const packing = data.packing !== null;
        const delivery = data.delivery !== null;
        const bom = data.bom !== null;
        const mrn = data.mrn !== null;
        const gin = data.gin !== null;
        const grp = data.grp !== null;
        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            stockCheck,
            mip,
            packing,
            delivery,
            notes,
            bom,
            mrn,
            gin,
            grp,
            stageDescription,
            // Add other properties if needed
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for sales_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(`/api/check/production_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    const itemCode = req.params.itemCode;
    try {
        const result = await client.query(
            `SELECT * FROM production_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }
        const data = result.rows[0];

        // Check if specific columns are null or not
        const specification_check = data.specification_check !== null;
        const bom_check = data.bom_check !== null;
        const work_schedule = data.work_schedule !== null;
        const assembly = data.assembly !== null;
        const f_testing = data.f_testing !== null;
        const documentation = data.documentation !== null;

        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            specification_check,
            bom_check,
            work_schedule,
            assembly,
            f_testing,
            documentation,
            notes,
            stageDescription,
            // Add other properties if needed
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for sales_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(`/api/check/purchase_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    console.log("OA Number : ", oaNumber);
    const itemCode = req.params.itemCode;
    try {
        const result = await client.query(
            `SELECT * FROM purchase_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }
        const data = result.rows[0];

        // Check if specific columns are null or not
        const materialStatus = data.material_status !== null;
        const mrp = data.mrp !== null;
        const po = data.po !== null;
        const material_reciept_eta = data.material_receipt_eta !== null;
        const market_shortage = data.market_shortage;
        const price_hike = data.price_hike;
        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            materialStatus,
            mrp,
            po,
            material_reciept_eta,
            notes,
            market_shortage,
            price_hike,
            stageDescription,
            // Add other properties if needed
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for sales_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get(`/api/check/quality_data/:oaNumber/:itemCode`, async(req, res) => {
    const oaNumber = req.params.oaNumber;
    const itemCode = req.params.itemCode;
    try {
        const result = await client.query(
            `SELECT * FROM qc_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "No data found for the provided oa_number" });
        }
        const data = result.rows[0];

        // Check if specific columns are null or not
        const specification_check = data.specification_check !== null;
        const oqc = data.oqc !== null;
        const notes = data.notes;

        // Query to get stage from team_data
        const stageResult = await client.query(
            `SELECT stage FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        const activeResult = await client.query(
            `SELECT status FROM team_data WHERE oa_number = $1 AND item_code = $2`, [oaNumber, itemCode]
        );

        const status = activeResult.rows[0].status;

        let stageDescription = null; // Default to null if no stage found

        if (stageResult.rows.length > 0) {
            const stage = stageResult.rows[0].stage;

            // Map stage number to corresponding stage name
            switch (stage) {
                case 1:
                    stageDescription = "sales";
                    break;
                case 2:
                    stageDescription = "purchase";
                    break;
                case 3:
                    stageDescription = "stores";
                    break;
                case 4:
                    stageDescription = "r&d";
                    break;
                case 5:
                    stageDescription = "production";
                    break;
                case 6:
                    stageDescription = "qc";
                    break;
                case 7:
                    stageDescription = "accounts";
                    break;
                default:
                    stageDescription = null; // If stage does not match any case
            }
        }

        // Construct response object with checkbox values and auto-filled fields
        const response = {
            rows: result.rows,
            specification_check,
            oqc,
            notes,
            stageDescription,
            status,
            // Add other properties if needed
        };

        res.json(response);
    } catch (error) {
        console.error(`Error executing query for sales_data`, error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ----------------------------------------------------------------------------------------------------//
app.get("/api/total_balance_amount", async(req, res) => {
    try {
        const query = `
            SELECT 
                order_category, 
                SUM(CAST(balance_amount AS NUMERIC)) AS total_balance_amount,
                COUNT(*) AS total_rows
            FROM team_data
            GROUP BY order_category
        `;
        const result = await client.query(query);
        res.json({ rows: result.rows });
        console.log("ORDER BAR CHART DATA:", result.rows);
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/filter/:table", async(req, res) => {
    const tableName = req.params.table;
    console.log("Table Name:", tableName);
    const selectedCategory = req.query.category; // Get the selected order category from query parameter
    try {
        let query = `SELECT * FROM ${tableName}`; // Replace your_table_name with your actual table name

        // If a category is specified and it's not "All Order Categories", add a WHERE clause to filter by category
        if (selectedCategory && selectedCategory !== "All Order Categories") {
            if (selectedCategory === "New") {
                query += ` WHERE order_category = 'New R&D'`; // If category is "New", filter by "New R&D"
            } else if (selectedCategory === "Maruti") {
                query += ` WHERE order_category LIKE '%Maruti%'`;
            } else {
                query += ` WHERE order_category = '${selectedCategory}'`; // Otherwise, filter by the selected category
            }
        }

        const result = await client.query(query);
        res.json({ rows: result.rows });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// Define a static route for your CSS and JS files
app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/api/user", (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: "Not logged in" });
    }
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("index");
});

app.get("/management", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("management");
});
app.get("/gnatt", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("gnatt");
});
// --------------------------------PAGE LINKING AND REDIRECT--------------------------------------------------//
// Helper function to create routes dynamically
function createRoutes(basePath, views) {
    views.forEach((view) => {
        console.log(`Setting up route: ${basePath}/${view}`); // Debugging statement
        app.get(`${basePath}/${view}`, (req, res) => {
            if (!req.session.user) {
                console.log(
                    `User not authenticated, redirecting from: ${basePath}/${view}`
                ); // Debugging statement
                return res.redirect("/");
            }
            console.log(`Rendering view: ${view} for route: ${basePath}/${view}`); // Debugging statement
            res.render(`${view}`);
        });
    });
}

// Define all routes with their respective base paths and views
const routes = [
    { basePath: "/sales-table", views: ["edit-sales", "sales-table"] },
    { basePath: "/stores-table", views: ["edit-stores", "stores-table"] },
    { basePath: "/rnd-table", views: ["edit-rnd", "rnd-table"] },
    { basePath: "/accounts-table", views: ["edit-accounts", "accounts-table"] },
    { basePath: "/purchase-table", views: ["edit-purchase", "purchase-table"] },
    {
        basePath: "/production-table",
        views: ["edit-production", "production-table"],
    },
    { basePath: "/quality-table", views: ["edit-quality", "quality-table"] },
];

// Generate routes dynamically
routes.forEach((route) => {
    console.log(`Generating routes for base path: ${route.basePath}`); // Debugging statement
    createRoutes(route.basePath, route.views);
});

// Handle the employee route separately
app.get("/employee", (req, res) => {
    console.log("Processing /employee route"); // Debugging statement
    if (!req.session.user) {
        console.log("User not authenticated, redirecting from /employee"); // Debugging statement
        return res.redirect("/");
    }
    console.log("Rendering employee view"); // Debugging statement
    res.render("employee");
});

// ------------------------------------QUERIES TO GET EACH TABLE----------------------------------------------------//
app.get("/api/accounts", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;

    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM accounts_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing 1st query:", query);
        console.log("With parameters:", queryParams);

        // Execute the first query to get accounts data
        const result = await client.query(query, queryParams);
        const accountRows = result.rows;

        if (accountRows.length === 0) {
            return res.json({ rows: [] }); // No data to process
        }

        const oaItemPairs = accountRows.map((row) => [
            row.oa_number,
            row.item_code,
        ]);

        let query2 = `
          SELECT oa_number, item_code, status, reason
          FROM team_data
          WHERE
        `;

        // Dynamically construct the WHERE conditions for each pair of (oa_number, item_code)
        const whereConditions = oaItemPairs
            .map(
                ([oa_number, item_code], index) =>
                `(oa_number = $${index * 2 + 1} AND item_code = $${index * 2 + 2})`
            )
            .join(" OR ");

        // Append the dynamic conditions to the query
        query2 += whereConditions;

        // Prepare the parameters for the second query
        const query2Params = oaItemPairs.flat(); // Flatten the array of pairs into a single array

        console.log("Executing 2nd query:", query2);
        console.log("With parameters:", query2Params);

        // Execute the second query
        const teamResult = await client.query(query2, query2Params);
        const teamRows = teamResult.rows;

        // Create a map for quick lookup of status and reason by (oa_number, item_code)
        const teamDataMap = {};
        teamRows.forEach((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            teamDataMap[key] = {
                status: row.status,
                reason: row.reason,
            };
        });

        // Merge the team_data (status and reason) with the accountRows
        const mergedResults = accountRows.map((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            const teamData = teamDataMap[key] || { status: null, reason: null };
            return {
                ...row,
                status: teamData.status,
                reason: teamData.reason,
            };
        });

        console.log("Merged results:", mergedResults);

        // Send the merged results as a response
        res.json({ rows: mergedResults });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/rnd", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;

    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM rnd_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing query:", query);
        console.log("With parameters:", queryParams);
        const result = await client.query(query, queryParams);
        const qualityRows = result.rows;

        if (qualityRows.length === 0) {
            return res.json({ rows: [] }); // No data to process
        }

        // Collect all the (oa_number, item_code) pairs for the second query
        const oaItemPairs = qualityRows.map((row) => [
            row.oa_number,
            row.item_code,
        ]);

        // Prepare the second query to get status and reason from team_data using both oa_number and item_code
        let query2 = `
      SELECT oa_number, item_code, status, complete, reason
      FROM team_data
      WHERE
    `;

        // Dynamically construct the WHERE conditions for each pair of (oa_number, item_code)
        const whereConditions = oaItemPairs
            .map(
                ([oa_number, item_code], index) =>
                `(oa_number = $${index * 2 + 1} AND item_code = $${index * 2 + 2})`
            )
            .join(" OR ");

        query2 += whereConditions;

        const query2Params = oaItemPairs.flat();

        console.log("Executing 2nd query:", query2);
        console.log("With parameters:", query2Params);

        const teamResult = await client.query(query2, query2Params);
        const teamRows = teamResult.rows;

        const teamDataMap = {};
        teamRows.forEach((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            teamDataMap[key] = {
                status: row.status,
                reason: row.reason,
                complete: row.complete,
            };
        });

        // Merge the team_data (status and reason) with the qualityRows
        const mergedResults = qualityRows.map((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            const teamData = teamDataMap[key] || {
                status: null,
                reason: null,
                complete: null,
            };
            return {
                ...row,
                status: teamData.status,
                reason: teamData.reason,
                complete: teamData.complete,
            };
        });

        console.log("Merged results:", mergedResults);
        // Send the merged results as a response
        res.json({ rows: mergedResults });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/sales", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;
    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM team_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing query:", query);
        console.log("With parameters:", queryParams);

        const result = await client.query(query, queryParams);

        console.log("Query result:", result.rows);
        res.json({ rows: result.rows });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/stores", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;
    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM stores_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing 1st query:", query);
        console.log("With parameters:", queryParams);

        // Execute the first query to get quality data
        const result = await client.query(query, queryParams);
        const qualityRows = result.rows;

        if (qualityRows.length === 0) {
            return res.json({ rows: [] }); // No data to process
        }

        // Collect all the (oa_number, item_code) pairs for the second query
        const oaItemPairs = qualityRows.map((row) => [
            row.oa_number,
            row.item_code,
        ]);

        // Prepare the second query to get status and reason from team_data using both oa_number and item_code
        let query2 = `
      SELECT oa_number, item_code, status, reason
      FROM team_data
      WHERE
    `;

        // Dynamically construct the WHERE conditions for each pair of (oa_number, item_code)
        const whereConditions = oaItemPairs
            .map(
                ([oa_number, item_code], index) =>
                `(oa_number = $${index * 2 + 1} AND item_code = $${index * 2 + 2})`
            )
            .join(" OR ");

        query2 += whereConditions;

        const query2Params = oaItemPairs.flat();

        console.log("Executing 2nd query:", query2);
        console.log("With parameters:", query2Params);

        const teamResult = await client.query(query2, query2Params);
        const teamRows = teamResult.rows;

        const teamDataMap = {};
        teamRows.forEach((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            teamDataMap[key] = {
                status: row.status,
                reason: row.reason,
            };
        });

        // Merge the team_data (status and reason) with the qualityRows
        const mergedResults = qualityRows.map((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            const teamData = teamDataMap[key] || { status: null, reason: null };
            return {
                ...row,
                status: teamData.status,
                reason: teamData.reason,
            };
        });

        console.log("Merged results:", mergedResults);
        // Send the merged results as a response
        res.json({ rows: mergedResults });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/production", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;
    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM production_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing 1st query:", query);
        console.log("With parameters:", queryParams);

        const result = await client.query(query, queryParams);
        const productionRows = result.rows;

        if (productionRows.length === 0) {
            return res.json({ rows: [] });
        }

        const oaItemPairs = productionRows.map((row) => [
            row.oa_number,
            row.item_code,
        ]);

        let query2 = `
        SELECT oa_number, item_code, status, reason
        FROM team_data
        WHERE
      `;

        const whereConditions = oaItemPairs
            .map(
                ([oa_number, item_code], index) =>
                `(oa_number = $${index * 2 + 1} AND item_code = $${index * 2 + 2})`
            )
            .join(" OR ");

        query2 += whereConditions;

        const query2Params = oaItemPairs.flat();

        console.log("Executing 2nd query:", query2);
        console.log("With parameters:", query2Params);

        const teamResult = await client.query(query2, query2Params);
        const teamRows = teamResult.rows;

        const teamDataMap = {};
        teamRows.forEach((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            teamDataMap[key] = {
                status: row.status,
                reason: row.reason,
            };
        });

        const mergedResults = productionRows.map((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            const teamData = teamDataMap[key] || { status: null, reason: null };
            return {
                ...row,
                status: teamData.status,
                reason: teamData.reason,
            };
        });

        console.log("Merged results:", mergedResults);

        res.json({ rows: mergedResults });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/purchase", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;

    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM purchase_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing 1st query:", query);
        console.log("With parameters:", queryParams);

        // Execute the first query to get quality data
        const result = await client.query(query, queryParams);
        const qualityRows = result.rows;

        if (qualityRows.length === 0) {
            return res.json({ rows: [] }); // No data to process
        }

        // Collect all the (oa_number, item_code) pairs for the second query
        const oaItemPairs = qualityRows.map((row) => [
            row.oa_number,
            row.item_code,
        ]);

        // Prepare the second query to get status and reason from team_data using both oa_number and item_code
        let query2 = `
      SELECT oa_number, item_code, status, reason
      FROM team_data
      WHERE
    `;

        // Dynamically construct the WHERE conditions for each pair of (oa_number, item_code)
        const whereConditions = oaItemPairs
            .map(
                ([oa_number, item_code], index) =>
                `(oa_number = $${index * 2 + 1} AND item_code = $${index * 2 + 2})`
            )
            .join(" OR ");

        query2 += whereConditions;

        const query2Params = oaItemPairs.flat();

        console.log("Executing 2nd query:", query2);
        console.log("With parameters:", query2Params);

        const teamResult = await client.query(query2, query2Params);
        const teamRows = teamResult.rows;

        const teamDataMap = {};
        teamRows.forEach((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            teamDataMap[key] = {
                status: row.status,
                reason: row.reason,
            };
        });

        // Merge the team_data (status and reason) with the qualityRows
        const mergedResults = qualityRows.map((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            const teamData = teamDataMap[key] || { status: null, reason: null };
            return {
                ...row,
                status: teamData.status,
                reason: teamData.reason,
            };
        });

        console.log("Merged results:", mergedResults);

        // Send the merged results as a response
        res.json({ rows: mergedResults });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/quality", async(req, res) => {
    const { startMonth, startYear, endMonth, endYear, category } = req.query;

    console.log("Received request with query parameters:", {
        startMonth,
        startYear,
        endMonth,
        endYear,
        category,
    });

    if (!startMonth || !startYear || !endMonth || !endYear) {
        console.log("Missing month or year in request.");
        return res
            .status(400)
            .json({ error: "Start and end month/year are required" });
    }

    try {
        let query = `
            SELECT *
            FROM qc_data
            WHERE (EXTRACT(YEAR FROM oa_date) * 12 + EXTRACT(MONTH FROM oa_date)) 
                  BETWEEN (($1::INTEGER * 12) + $2::INTEGER) AND (($3::INTEGER * 12) + $4::INTEGER)
        `;

        const queryParams = [startYear, startMonth, endYear, endMonth];

        if (category && category !== "All Order Categories") {
            query += " AND order_category = $5";
            queryParams.push(category);
        }

        console.log("Executing 1st query:", query);
        console.log("With parameters:", queryParams);

        // Execute the first query to get quality data
        const result = await client.query(query, queryParams);
        const qualityRows = result.rows;

        if (qualityRows.length === 0) {
            return res.json({ rows: [] }); // No data to process
        }

        // Collect all the (oa_number, item_code) pairs for the second query
        const oaItemPairs = qualityRows.map((row) => [
            row.oa_number,
            row.item_code,
        ]);

        // Prepare the second query to get status and reason from team_data using both oa_number and item_code
        let query2 = `
        SELECT oa_number, item_code, status, reason
        FROM team_data
        WHERE
      `;

        // Dynamically construct the WHERE conditions for each pair of (oa_number, item_code)
        const whereConditions = oaItemPairs
            .map(
                ([oa_number, item_code], index) =>
                `(oa_number = $${index * 2 + 1} AND item_code = $${index * 2 + 2})`
            )
            .join(" OR ");

        query2 += whereConditions;

        const query2Params = oaItemPairs.flat();

        console.log("Executing 2nd query:", query2);
        console.log("With parameters:", query2Params);
        const teamResult = await client.query(query2, query2Params);
        const teamRows = teamResult.rows;

        const teamDataMap = {};
        teamRows.forEach((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            teamDataMap[key] = {
                status: row.status,
                reason: row.reason,
            };
        });

        // Merge the team_data (status and reason) with the qualityRows
        const mergedResults = qualityRows.map((row) => {
            const key = `${row.oa_number}-${row.item_code}`;
            const teamData = teamDataMap[key] || { status: null, reason: null };
            return {
                ...row,
                status: teamData.status,
                reason: teamData.reason,
            };
        });

        console.log("Merged results:", mergedResults);
        // Send the merged results as a response
        res.json({ rows: mergedResults });
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//  ----------------------------------------------------------------------------------------------------//
app.get("/team-table", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("team-table");
});

// Route to render the login1.ejs file
app.get("/", (req, res) => {
    res.render("login1"); // Renders the login1.ejs file from the 'views' folder
});

app.get("/completed-table", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("completed-table");
});

app.get("/late-table", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("late-table");
});
app.get("/delay-report", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("delay-report");
});

app.get("/daily-planning", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("daily-planning");
});

app.get("/planning-next", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    res.render("planningnext");
});
// ----------------------------------------QUERIES TO UPDATE EACH TABLE--------------------------------------------------------------------//
//PUT
app.put("/api/accounts/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const {
        gst_number,
        statutory_details,
        terms_of_payment,
        advance_received,
        invoicing,
        notes,
    } = req.body;

    try {
        console.log(
            "Received PUT request to update accounts data with OA number:",
            oaNumber
        );
        console.log("Request body:", req.body);
        const query = `
      UPDATE accounts_data 
      SET 
      gst_number = $1, 
      statutory_details = $2, 
      terms_of_payment = $3, 
      advance_received = $4,
      invoicing = $5,
        notes = $6
      WHERE oa_number = $7 
       AND item_code = $8
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            gst_number,
            statutory_details,
            terms_of_payment,
            advance_received,
            invoicing,
            notes,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            gst_number,
            statutory_details,
            terms_of_payment,
            advance_received,
            invoicing,
            notes,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);
        res.json({
            message: "accounts data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating accounts data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/rnd/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const {
        specification_check,
        bom,
        rnd_complete,
        notes,
        user_manual,
        storing_final_documents_in_folder,
        circuit_diagrams,
        testing_manual,
    } = req.body;

    try {
        console.log(
            "Received PUT request to update sales data with OA number:",
            oaNumber
        );
        console.log("Request body:", req.body);

        const query = `
        UPDATE rnd_data 
        SET 
        specification_check = $1, 
        bom = $2, 
        rnd_complete = $3, 
        notes = $4,
        user_manual = $5,
        circuit_diagrams = $6,
        testing_manual = $7,
        storing_final_documents_in_folder = $8
        WHERE oa_number = $9 
        AND item_code = $10
        RETURNING *
        `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            specification_check,
            bom,
            rnd_complete,
            notes,
            user_manual,
            circuit_diagrams,
            testing_manual,
            storing_final_documents_in_folder,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            specification_check,
            bom,
            rnd_complete,
            notes,
            user_manual,
            circuit_diagrams,
            testing_manual,
            storing_final_documents_in_folder,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);
        if (
            user_manual !== null &&
            specification_check !== null &&
            bom !== null &&
            storing_final_documents_in_folder !== null &&
            circuit_diagrams !== null &&
            testing_manual !== null
        ) {
            updateStage(4, oaNumber, itemCode);
        }
        res.json({
            message: "rnd data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating rnd data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Define departments and priority checks
const departments = {
    1: "Sales", // Sales department
    2: "Purchase", // Purchase department
    3: "Stores", // Stores department
    4: "R&D", // Research and Development department
    5: "Production", // Production department
    6: "QC", // Quality Control department
    7: "Accounts", // Accounts department
};

const priority = {
    1: ["so_check_with_quotation", "specs_check", "terms_of_payment"], // Sales
    2: ["mrp", "material_receipt_eta"], // Purchase
    3: ["bom", "stock_check", "mrn", "gin", "m_i_p"], // Stores
    4: ["specification_check", "bom", "rnd_complete"], // R&D
    5: ["specification_check", "bom_check", "assembly", "f_testing", "documentation"], // Production
    6: ["specification_check", "oqc"], // QC
    7: ["gst_number", "statutory_details", "terms_of_payment", "invoicing"], // Accounts
};

// Define corresponding data tables
const dataTables = {
    1: "sales_data",
    2: "purchase_data",
    3: "stores_data",
    4: "rnd_data",
    5: "production_data",
    6: "qc_data",
    7: "accounts_data",
};

const createPushforwardAlertMessage = (
    oaNumber,
    fgCode,
    fromDepartment,
    toDepartment
) => {
    const sirenEmoji = "🟢"; // Siren emoji
    return (
        `${sirenEmoji}${sirenEmoji} Order Status ${sirenEmoji}${sirenEmoji}\n\n` +
        `*OA Number*: ${oaNumber}\n` +
        `*FG Code*: ${fgCode}\n` +
        `Order status is moved from ${fromDepartment} to ${toDepartment}\n` +
        `Please check and update the StatusQ.`
    );
};

const createPushforwardAlertMessage_Stores = (
    oaNumber,
    fgCode,
    fromDepartment,
    toDepartment
) => {
    const sirenEmoji = "📦"; // Siren emoji
    const sirenEmoji2 = "✅"; // Siren emoji
    return (
        `${sirenEmoji}${sirenEmoji} Order for Packing ${sirenEmoji}${sirenEmoji}\n\n` +
        `*OA Number*: ${oaNumber}\n` +
        `*FG Code*: ${fgCode}\n` +
        `Order status is moved from ${fromDepartment} to ${toDepartment}\n` +
        `QC check : PASS ${sirenEmoji2}\n` +
        `Please take above order for packing and update the StatusQue.`
    );
};

const createAlertsSales1 = (
    oa_number,
    item_code,
    oa_date
) => {
    const sirenEmoji = "📧"; // Siren emoji
    const sirenEmoji2 = "✅"; // Siren emoji
    const formattedDate = formatDate(oa_date); // Format the date before sending
    return (
        `${sirenEmoji}${sirenEmoji} Mail Not Sent Reminder ${sirenEmoji}${sirenEmoji}\n\n` +
        `*OA Number*: ${oa_number}\n` +
        `*FG Code*: ${item_code}\n` +
        `Order was placed on ${formattedDate}\n` +
        `It has been 24 hours since the Order has been placed\n` +
        `Please send the mail for above order through StatusQ.`
    );
};

const createAlertsAccounts1 = (
    oa_number,
    item_code,
    oa_date
) => {
    const sirenEmoji = "🧾"; // Siren emoji
    const sirenEmoji2 = "✅"; // Siren emoji
    const formattedDate = formatDate(oa_date); // Format the date before sending
    return (
        `${sirenEmoji}${sirenEmoji} Reminder for Invoicing of- ${sirenEmoji}${sirenEmoji}\n\n` +
        `*OA Number*: ${oa_number}\n` +
        `*FG Code*: ${item_code}\n` +
        `Stores has completed the packing on ${formattedDate}\n` +
        `Please follow through and complete the Invocing and update in StatusQ.`
    );
};

 // Schedule a task to run every 24 hours
 cron.schedule('00 11 * * 1-6', async () => {
    console.log('scheduled task Start');
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    // Get all Saturdays in the current month
    const saturdays = [];
    for (let date = 1; date <= 31; date++) {
        const d = new Date(year, month, date);
        if (d.getMonth() === month && d.getDay() === 6) {
            saturdays.push(d.getDate());
        }
    }

    // Determine if today is the 1st or 3rd Saturday
    if (day === saturdays[0] || day === saturdays[2]) {
        console.log("Skipping task because it's the 1st or 3rd Saturday.");
        return;
    }

    console.log('Running the scheduled task');

    const conditionMet = await checkCondition();
    if (conditionMet) {
        console.log('Condition met, sending WhatsApp messages...');
    }
});


// Example condition-checking function
async function checkCondition() {
console.log('QUery check running');
try {
    // Query the database for records in January 2025
    const query = `
        SELECT mail, oa_date, oa_number, item_code
        FROM sales_data
        WHERE oa_date >= '2025-01-01' AND oa_date < '2025-02-01'
    `;

    const result = await client.query(query);
    // console.log("RESULT : ", result.rows);

    // Iterate through the rows to check the condition
    if (result.rows.length > 0) {
        const currentDate = new Date();

        for (const row of result.rows) {
            const { oa_number, item_code, mail, oa_date } = row;

            // Check if the oa_date is 1 day before the current date
            const oneDayBefore = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate() - 1
            );
            const oaDateObj = new Date(oa_date);

            if (oaDateObj.toDateString() === oneDayBefore.toDateString()) {
                // Only trigger if the mail is null
                if (!mail) {
                    // console.log("OA number",oa_number);
                    await triggerMethod(oa_number, item_code, oa_date);
                }
            }
        }
    }

    return false;
} catch (err) {
    console.error('Error checking condition:', err.message);
    return false;
}
}

const formatDate = (date) => {
return moment(date).format('DD MMM YYYY'); // Format as '09 Jan 2025'
};

async function triggerMethod(oa_number, item_code, oa_date) {
console.log('Method triggered!');
const message = createAlertsSales1(
    oa_number,
    item_code,
    oa_date
);

// console.log("Message:", message);
const phoneNumber = await getPhoneNumberByDepartment("1");
console.log("Phone Number:", phoneNumber);


whatsapp
    .sendMessage(`919113810041@c.us`, message)
    // .sendMessage(`${phoneNumber}@c.us`, message)
    .then((response) => {
        console.log("Message sent successfully:", response);
    })
    .catch((err) => {
        console.error("Error sending message:", err);
    });

console.log("WhatsApp message is being sent...");
// Your method logic here
}


// Function to check priority and update stage
async function updateStage(user_dep, oa_number, item_code) {
    const main_dep = user_dep;
    const getOrderCategoryQuery = `
      SELECT order_category, stage 
      FROM team_data 
      WHERE oa_number = $1 AND item_code = $2
  `;
    const orderCategoryResult = await client.query(getOrderCategoryQuery, [
        oa_number,
        item_code,
    ]);

    if (orderCategoryResult.rows.length === 0) {
        throw new Error("No data found for the given OA number and item code.");
    }

    const { order_category, stage } = orderCategoryResult.rows[0]; // Extract order_category and stage
    var newStage;
    if (stage == null) {
        newStage = user_dep; // Initialize newStage to current department if stage is null
    } else {
        newStage = stage;
    }

    let shouldUpdate = false; // Flag to determine if stage needs updating

    // Loop through the departments starting from the current one
    for (
        let dep = user_dep + 1; dep <= Object.keys(departmentsTo).length; dep++
    ) {
        const currentDep = departmentsTo[dep]; // Get current department
        const currentTable = dataTables[dep]; // Get corresponding table

        // Handle "New R&D" case: Skip R&D checks if not "New R&D" and department is R&D (dep 4)
        if (dep === 4 && order_category !== "New R&D") {
            console.log("Skipping R&D checks since order category is not 'New R&D'");
            continue; // Skip R&D and go to the next department
        }

        // Fetch priority check data from the department's corresponding table
        const selectQuery = `
          SELECT ${priority[dep].join(", ")} 
          FROM ${currentTable} 
          WHERE oa_number = $1 AND item_code = $2
      `;
        const result = await client.query(selectQuery, [oa_number, item_code]);

        if (result.rows.length === 0) {
            throw new Error(`No data found for ${currentDep} in ${currentTable}`);
        }

        const checks = result.rows[0]; // Extract checks

        // Check if all priority checks are completed for the current department
        const allChecksDone = priority[dep].every(
            (check) => checks[check] !== null
        );

        if (allChecksDone) {
            console.log(
                `All priority checks completed for department: ${currentDep}. Moving to next department.`
            );
            newStage = dep; // Increment stage to the next department
        } else {
            console.log(
                `Priority checks not completed for department: ${currentDep}. Stopping here.`
            );
            shouldUpdate = true; // Stage should be updated later
            newStage = dep; // Increment stage to the next department
            break; // Stop the loop if priority checks are not done
        }
    }
    // Update the stage in team_data at the end of the process
    if (shouldUpdate) {
        const updateStageQuery = `
          UPDATE team_data 
          SET stage = $1
          WHERE oa_number = $2 AND item_code = $3
      `;
        await client.query(updateStageQuery, [newStage, oa_number, item_code]);
        console.log(
            `Stage updated to ${newStage} for OA number ${oa_number} and item code ${item_code}.`
        );
        const toDepartment = departmentsTo[newStage];
        const fromDepartment = departmentsTo[main_dep];
        const phoneNumber = await getPhoneNumberByDepartment(newStage);
        const message = createPushforwardAlertMessage(
            oa_number,
            item_code,
            fromDepartment,
            toDepartment
        );

        console.log("Message:", message);

        whatsapp
            .sendMessage(`${phoneNumber}@c.us`, message)
            .then((response) => {
                console.log("Message sent successfully:", response);
            })
            .catch((err) => {
                console.error("Error sending message:", err);
            });

        console.log("WhatsApp message is being sent...");
    } else {
        console.log("No stage update required as all checks are not completed.");
    }
}

app.put("/api/sales/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const {
        so_check_with_quotation,
        specs_check,
        late_clause,
        terms_of_payment,
        delivery,
        advance_received,
        mail,
        notes,
    } = req.body;

    console.log("Terms of Payment:", terms_of_payment);

    try {
        console.log(
            "Received PUT request to update sales data with OA number:",
            oaNumber,
            "and item code:",
            itemCode
        );
        console.log("Request body:", req.body);

        const query = `
      UPDATE sales_data 
      SET 
        so_check_with_quotation = $1, 
        specs_check = $2, 
        late_clause = $3,
        terms_of_payment = $4, 
        mail = $5, 
        notes = $6,
        delivery = $7,
        advance_recieved = $8
      WHERE oa_number = $9 
       AND item_code = $10
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            so_check_with_quotation,
            specs_check,
            late_clause,
            terms_of_payment,
            mail,
            notes,
            delivery,
            advance_received,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            so_check_with_quotation,
            specs_check,
            late_clause,
            terms_of_payment,
            mail,
            notes,
            delivery,
            advance_received,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);

        //Check if minimum is check so that it is pused to next stage
        // Query to get data from sales_data
        const selectSalesQuery = `
      SELECT so_check_with_quotation, specs_check, terms_of_payment, cust_email, mail 
      FROM sales_data 
      WHERE oa_number = $1 AND item_code = $2
    `;

        const salesResult = await client.query(selectSalesQuery, [
            oaNumber,
            itemCode,
        ]);

        if (salesResult.rows.length > 0) {
            const {
                so_check_with_quotation,
                specs_check,
                terms_of_payment,
                cust_email,
                mail,
            } = salesResult.rows[0];

            if (cust_email !== null) {
                if (
                    so_check_with_quotation !== null &&
                    specs_check !== null &&
                    terms_of_payment !== null &&
                    mail !== null
                ) {
                    updateStage(1, oaNumber, itemCode);
                } else {
                    console.log("No fields were set, no stage update.");
                }
            } else {
                if (
                    so_check_with_quotation !== null &&
                    specs_check !== null &&
                    terms_of_payment !== null
                ) {
                    updateStage(1, oaNumber, itemCode);
                } else {
                    console.log("No fields were set, no stage update.");
                }
            }
        }
        res.json({
            message: "Sales data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating sales data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/stores/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const { stock_check, m_i_p, packing, delivery, notes, bom, mrn, gin, grp } =
    req.body;

    try {
        console.log(
            "Received PUT request to update stores data with OA number:",
            oaNumber,
            "and item code:",
            itemCode
        );
        console.log("Request body:", req.body);

        const query = `
      UPDATE stores_data 
      SET 
        stock_check = $1, 
        m_i_p = $2, 
        packing = $3,
        delivery = $4, 
        notes = $5,
        bom = $6,
        mrn = $7,
        gin = $8,
        grp =$9
      WHERE oa_number = $10 
      AND item_code = $11
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            stock_check,
            m_i_p,
            packing,
            delivery,
            notes,
            bom,
            mrn,
            gin,
            grp,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            stock_check,
            m_i_p,
            packing,
            delivery,
            notes,
            bom,
            mrn,
            gin,
            grp,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);

        if (
            m_i_p !== null &&
            stock_check !== null &&
            bom !== null &&
            mrn !== null &&
            gin !== null &&
            grp !== null
        ) {
            updateStage(3, oaNumber, itemCode);
        }

        res.json({
            message: "stores data updated successfully",
            updatedRows: result.rows,
        });
        console.log("sEND sUCCESS");
    } catch (error) {
        console.log("sEND eRROR");
        console.error("Error updating stores data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/production/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const {
        specification_check,
        bom_check,
        work_schedule,
        assembly,
        f_testing,
        documentation,
        notes,
    } = req.body;

    try {
        console.log(
            "Received PUT request to update production data with OA number:",
            oaNumber
        );
        console.log("Request body:", req.body);

        const query = `
      UPDATE production_data 
      SET 
      specification_check = $1, 
      bom_check = $2, 
      work_schedule = $3, 
      assembly = $4,
      f_testing = $5,
      documentation = $6,
      notes = $7
      WHERE oa_number = $8 
      AND item_code = $9
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            specification_check,
            bom_check,
            work_schedule,
            assembly,
            f_testing,
            documentation,
            notes,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            specification_check,
            bom_check,
            work_schedule,
            assembly,
            f_testing,
            documentation,
            notes,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);

        res.json({
            message: "production data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating production data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/purchase/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const {
        material_status,
        mrp,
        po,
        market_shortage,
        price_hike,
        material_receipt_eta,
        notes,
        allMaterialReceived,
    } = req.body;

    try {
        console.log(
            "Received PUT request to update accounts data with OA number:",
            oaNumber
        );
        console.log("Request body:", req.body);

        const query = `
      UPDATE purchase_data 
      SET 
      material_status = $1, 
      mrp = $2, 
      po = $3, 
      market_shortage = $4,
      price_hike = $5,
      material_receipt_eta = $6,
      notes = $7,
      allMaterialReceived =$8
      WHERE oa_number = $9 
      AND item_code = $10
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            material_status,
            mrp,
            po,
            market_shortage,
            price_hike,
            material_receipt_eta,
            notes,
            allMaterialReceived,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            material_status,
            mrp,
            po,
            market_shortage,
            price_hike,
            material_receipt_eta,
            notes,
            allMaterialReceived,
            oaNumber,
            itemCode,
        ]);

        if (mrp !== null && po !== null && allMaterialReceived !== null) {
            updateStage(2, oaNumber, itemCode);
        }

        console.log("Query executed successfully. Updated rows:", result.rows);

        res.json({
            message: "purchase data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating purchase data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/quality/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const { specification_check, oqc, notes } = req.body;

    try {
        console.log(
            "Received PUT request to update quality data with OA number:",
            oaNumber
        );
        console.log("Request body:", req.body);

        const query = `
      UPDATE qc_data 
      SET 
      specification_check = $1, 
      oqc = $2, 
        notes = $3
      WHERE oa_number = $4
      AND item_code = $5
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [
            specification_check,
            oqc,
            notes,
            oaNumber,
            itemCode,
        ]);

        const result = await client.query(query, [
            specification_check,
            oqc,
            notes,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);

        if (specification_check !== null && oqc !== null) {
            updateStage(6, oaNumber, itemCode);

            const toDepartment = departmentsTo[3];
            const fromDepartment = departmentsTo[6];
            const phoneNumber = await getPhoneNumberByDepartment(3);
            const message = createPushforwardAlertMessage_Stores(
                oaNumber,
                itemCode,
                fromDepartment,
                toDepartment
            );

            console.log("Message:", message);

            whatsapp
                .sendMessage(`${phoneNumber}@c.us`, message)
                .then((response) => {
                    console.log("Message sent successfully:", response);
                })
                .catch((err) => {
                    console.error("Error sending message:", err);
                });
        }

        res.json({
            message: "quality data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating quality data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/api/planning/:oa_number/:item_code", async(req, res) => {
    const oaNumber = req.params.oa_number;
    const itemCode = req.params.item_code;
    const { selected, inhousing } = req.body;

    try {
        console.log(
            "Received PUT request to update planning data with OA number:",
            oaNumber
        );
        console.log("Request body:", req.body);

        const query = `
      UPDATE planning 
      SET selected = $1, 
          inhousing = $2
      WHERE "oa_number" = $3 
      AND item_code = $4
      RETURNING *
    `;

        console.log("Executing SQL query:", query);
        console.log("With parameters:", [selected, inhousing, oaNumber, itemCode]);

        const result = await client.query(query, [
            selected,
            inhousing,
            oaNumber,
            itemCode,
        ]);

        console.log("Query executed successfully. Updated rows:", result.rows);

        res.json({
            message: "Planning data updated successfully",
            updatedRows: result.rows,
        });
    } catch (error) {
        console.error("Error updating planning data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


//-----------------------------------UPDATE TEAM DATA-------------------------------------------------------------//
app.put("/api/team_data/team/:oa_number/:item_code", async(req, res) => {
    const oa_number = req.params.oa_number;
    const item_code = req.params.item_code;
    console.log("Enter in team table");
    const {
        sales_late_clause,
        sales_mail,
        purchase_shortage,
        purchase_price_hike,
        rnd_specification_check,
        rnd_finished,
        prod_assembly,
        prod_f_testing,
        prod_qc,
        qc_oqc,
        stores_packing,
        stores_delivery,
        accounts_advance_received,
        accounts_invoicing,
        status,
        reason,
        purchase_material_delay,
        purchase_material_receipt_eta,
        notes,
        complete,
    } = req.body;

    console.log(req.body);

    try {
        const selectQuery = `
            SELECT * FROM team_data 
            WHERE oa_number = $1 AND item_code = $2 
            AND (status IS DISTINCT FROM 1 OR status IS NULL)`;

        const currentData = await client.query(selectQuery, [oa_number, item_code]);
        console.log("2");
        if (currentData.rows.length === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        const existingRecord = currentData.rows[0];
        const updatedNotes = notes ?
            existingRecord.notes ?
            existingRecord.notes + " " + notes :
            notes :
            existingRecord.notes;

        const queryText = `
            UPDATE team_data SET 
                sales_late_clause = CASE WHEN $1::DATE IS NOT NULL AND sales_late_clause IS NULL THEN $1::DATE ELSE sales_late_clause END,
                sales_mail = CASE WHEN $2::DATE IS NOT NULL AND sales_mail IS NULL THEN $2::DATE ELSE sales_mail END,
                purchase_shortage = CASE WHEN $3::TEXT IS NOT NULL AND purchase_shortage IS NULL THEN $3::TEXT ELSE purchase_shortage END,
                purchase_price_hike = CASE WHEN $4::TEXT IS NOT NULL AND purchase_price_hike IS NULL THEN $4::TEXT ELSE purchase_price_hike END,
                rnd_specification_check = CASE WHEN $5::DATE IS NOT NULL AND rnd_specification_check IS NULL THEN $5::DATE ELSE rnd_specification_check END,
                rnd_finished = CASE WHEN $6::DATE IS NOT NULL AND rnd_finished IS NULL THEN $6::DATE ELSE rnd_finished END,
                prod_assembly = CASE WHEN $7::DATE IS NOT NULL AND prod_assembly IS NULL THEN $7::DATE ELSE prod_assembly END,
                prod_f_testing = CASE WHEN $8::DATE IS NOT NULL AND prod_f_testing IS NULL THEN $8::DATE ELSE prod_f_testing END,
                prod_qc = CASE WHEN $9::DATE IS NOT NULL AND prod_qc IS NULL THEN $9::DATE ELSE prod_qc END,
                qc_oqc = CASE WHEN $10::DATE IS NOT NULL AND qc_oqc IS NULL THEN $10::DATE ELSE qc_oqc END,
                stores_packing = CASE WHEN $11::DATE IS NOT NULL AND stores_packing IS NULL THEN $11::DATE ELSE stores_packing END,
                stores_delivery = CASE WHEN $12::DATE IS NOT NULL AND stores_delivery IS NULL THEN $12::DATE ELSE stores_delivery END,
                accounts_advance_received = CASE WHEN $13::DATE IS NOT NULL AND accounts_advance_received IS NULL THEN $13::DATE ELSE accounts_advance_received END,
                accounts_invoicing = CASE WHEN $14::DATE IS NOT NULL AND accounts_invoicing IS NULL THEN $14::DATE ELSE accounts_invoicing END,
                purchase_material_delay = CASE WHEN $15::BOOLEAN IS NOT NULL AND purchase_material_delay IS NULL THEN $15::BOOLEAN ELSE purchase_material_delay END,
                purchase_material_receipt_eta = CASE WHEN $16::DATE IS NOT NULL AND purchase_material_receipt_eta IS NULL THEN $16::DATE ELSE purchase_material_receipt_eta END,
                notes = $17::TEXT,
                complete = CASE WHEN $18::BOOLEAN IS NOT NULL THEN $18::BOOLEAN ELSE complete END,
                status = CASE WHEN $19::INTEGER IS NOT NULL THEN $19::INTEGER ELSE status END, 
                reason = CASE WHEN $20::TEXT IS NOT NULL THEN $20::TEXT ELSE reason END 
            WHERE oa_number = $21 AND item_code = $22
            RETURNING *;
        `;

        const values = [
            sales_late_clause,
            sales_mail,
            purchase_shortage,
            purchase_price_hike,
            rnd_specification_check,
            rnd_finished,
            prod_assembly,
            prod_f_testing,
            prod_qc,
            qc_oqc,
            stores_packing,
            stores_delivery,
            accounts_advance_received,
            accounts_invoicing,
            purchase_material_delay,
            purchase_material_receipt_eta,
            updatedNotes,
            complete,
            status,
            reason,
            oa_number,
            item_code,
        ];

        console.log("Query Text:", queryText); // Logs the query text being executed.
        console.log("Values Passed:", values); // Logs the values being passed into the query.

        const result = await client.query(queryText, values);
        console.log("3 ", values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        console.log("Query executed successfully.");
        console.log("Result Rows:", result.rows); // Logs the result rows returned by the query.

        // Get the updated record
        const updatedRecord = result.rows[0];

        // Print the sales_late_clause before any adjustments
        console.log(
            "Updated sales_late_clause before adjustment:",
            updatedRecord.sales_late_clause
        );

        // Check if sales_late_clause is '1970-01-01' and adjust if necessary
        if (updatedRecord.sales_late_clause === "1970-01-01") {
            updatedRecord.sales_late_clause = "0000"; // Send 0000 instead of 1970-01-01
            console.log(
                "Adjusted sales_late_clause:",
                updatedRecord.sales_late_clause
            );
        }

        // Send the response with the updated record
        console.log("Success in team table");
        res.json(updatedRecord);
    } catch (error) {
        console.error("Error executing query:", error.message);
        console.log("Fail in team table");
        res.status(500).json({ error: error.message });
    }
});

// -------------------------------------------SEND MAIL LOGIC---------------------------------------------------------------//
// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "sales.kvartech@gmail.com",
        pass: "vfqy dmxo iufk dlku",
    },
});

// Function to send the email
function sendMail(recipient, subject, text) {
    const mailOptions = {
        from: "sales.kvartech@gmail.com",
        to: recipient,
        subject: subject,
        text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
}

// Endpoint to send email
app.post("/send-email/:oaNumber2/:itemCode2", async(req, res) => {
    const { oaNumber2, itemCode2 } = req.params;
    const { recipient, subject, text } = req.body;

    // Log the incoming request
    console.log("Request body:", req.body);
    console.log("ITEM CODE", itemCode2);
    console.log("OA NUMBER ", oaNumber2);

    if (!recipient || !subject || !text) {
        // Log missing fields
        console.log(
            "Missing fields - Recipient:",
            recipient,
            "Subject:",
            subject,
            "Text:",
            text
        );

        return res
            .status(400)
            .json({ error: "Recipient, subject, and text are required" });
    }

    try {
        // Query to check if cust_email exists in the sales_data table
        const queryText = `
          SELECT cust_email 
          FROM sales_data 
          WHERE oa_number = $1 AND item_code = $2
      `;
        const result = await client.query(queryText, [oaNumber2, itemCode2]);

        // Check if cust_email exists
        if (result.rows.length === 0 || !result.rows[0].cust_email) {
            console.log(
                "No customer email found for the given OA number and item code."
            );
            return res.status(404).json({
                error: "Customer email not found for the given OA number and item code",
            });
        }

        // If customer email exists, log and send email
        console.log("Customer email found:", result.rows[0].cust_email);
        console.log("Sending email to:", recipient);
        console.log("Email subject:", subject);
        console.log("Email text:", text);

        // Call the sendMail function to send the email
        sendMail(recipient, subject, text);

        // Respond with a success message
        res.status(200).json({ message: "Email sent successfully" });

        // Log success response
        console.log("Email sent successfully to:", recipient);
    } catch (error) {
        console.error("Error checking customer email or sending email:", error);
        return res
            .status(500)
            .json({ error: "An error occurred while processing your request" });
    }
});

//-----------------------------------------DATABASE FILL ENDPOINT------------------------------------------------//
app.post("/api/update/:table", async (req, res) => {
    const tableName = req.params.table;
    const data = req.body;

    console.log("Received update request for table:", tableName);
    console.log("Request data:", data);

    const allowedTables = [
        "master_data",
        "sales_data",
        "accounts_data",
        "purchase_data",
        "production_data",
        "stores_data",
        "qc_data",
        "rnd_data",
        "management_data",
        "team_data",
        "completed_data",
        "database_table",
    ];

    if (!allowedTables.includes(tableName)) {
        console.error("Invalid table name:", tableName);
        return res.status(400).json({ error: "Invalid table name" });
    }

    const { order_category, oa_date, oa_number, item_code, ...restData } = data;

    if (!oa_number || !item_code) {
        console.error("Missing required fields: oa_number and item_code");
        return res.status(400).json({ error: "Missing required fields: oa_number and item_code" });
    }

    const columns = Object.keys(restData);
    const values = Object.values(restData);
    console.log("VALUES ", values);

    try {
        let extraColumns = [];
        let extraValues = [];

        // Logic for "OEM" order_category
        if (order_category === "OEM") {
            if (tableName === "sales_data") {
                const salesColumns = [
                    "late_clause",
                    "so_check_with_quotation",
                    "terms_of_payment",
                    "advance_recieved",
                    "delivery"
                ];
                extraColumns.push(...salesColumns);
                extraValues.push(...Array(salesColumns.length).fill(oa_date));
            }

            if (tableName === "qc_data") {
                const qcColumns = ["specification_check"];
                extraColumns.push(...qcColumns);
                extraValues.push(...Array(qcColumns.length).fill(oa_date));
            }

            if (tableName === "accounts_data") {
                const accountsColumns = [
                    "gst_number",
                    "statutory_details",
                    "terms_of_payment",
                    "advance_received"
                ];
                extraColumns.push(...accountsColumns);
                extraValues.push(...Array(accountsColumns.length).fill(oa_date));
            }

            if (tableName === "team_data") {
                const teamColumns = [
                    "sales_late_clause",
                    "rnd_specification_check",
                    "rnd_finished",
                    "accounts_advance_received"
                ];
                extraColumns.push(...teamColumns);
                extraValues.push(...Array(teamColumns.length).fill(oa_date));
            }
        }

        // Handle specific cases for other tables (e.g., "rnd_data" and "team_data" not for "OEM")
        if (tableName === "rnd_data" && order_category !== "OEM" && order_category !== "New R&D") {
            const rndColumns = [
                "specification_check",
                "bom",
                "rnd_complete",
                "user_manual",
                "storing_final_documents_in_folder",
                "circuit_diagrams",
                "testing_manual",
            ];
            extraColumns.push(...rndColumns);
            extraValues.push(...Array(rndColumns.length).fill(oa_date));
        }

        if (tableName === "team_data" && order_category !== "OEM" && order_category !== "New R&D") {
            const teamColumns = ["rnd_specification_check", "rnd_finished"];
            extraColumns.push(...teamColumns);
            extraValues.push(...Array(teamColumns.length).fill(oa_date));
        }

        if (tableName === "team_data") {
            extraColumns.push("updated_at");
            extraValues.push(new Date().toISOString());

            if (!restData.stage) {
                extraColumns.push("stage");
                extraValues.push(1);
            }

            extraColumns.push("complete");
            extraValues.push(false);

            // Handle order_category explicitly
            if (!order_category) {
                console.warn("order_category not provided, setting default value");
                // extraColumns.push("order_category");
                // extraValues.push("Default Category");
            } 
        }

        console.log("Extra columns:", extraColumns);
        console.log("Extra values:", extraValues);

        const checkQuery = `SELECT * FROM ${tableName} WHERE oa_number = $1 AND item_code = $2`;
        console.log("Executing check query:", checkQuery);
        const checkResult = await client.query(checkQuery, [oa_number, item_code]);

        if (checkResult.rows.length > 0) {
            const updateColumns = [
                ...columns.map((col, i) => `${col} = $${i + 3}`),
                ...extraColumns.map((col, i) => `${col} = $${columns.length + i + 3}`),
            ];

            const updateQuery = `
                UPDATE ${tableName}
                SET ${updateColumns.join(", ")}
                WHERE oa_number = $1 AND item_code = $2
                RETURNING *`;

            console.log("Executing update query:", updateQuery);
            const result = await client.query(updateQuery, [oa_number, item_code, ...values, ...extraValues]);
            console.log("Update result:", result.rows[0]);
            res.json(result.rows[0]);
        } else {
            const insertColumns = ["order_category", "oa_number", "item_code", "oa_date", ...columns, ...extraColumns];
            const insertValues = [order_category, oa_number, item_code, oa_date, ...values, ...extraValues];

            const insertQuery = `
                INSERT INTO ${tableName} (${insertColumns.join(", ")})
                VALUES (${insertValues.map((_, i) => `$${i + 1}`).join(", ")})
                RETURNING *`;

            console.log("Executing insert query:", insertQuery);
            const result = await client.query(insertQuery, insertValues);
            console.log("Insert result:", result.rows[0]);
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error("Error executing query", error);
        res.status(500).json({
            error: "Database operation failed",
            details: error.message,
        });
    }
});

// --------------------------------------------------------------------------------------------------------------//
// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});