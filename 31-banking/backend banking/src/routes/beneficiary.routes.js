const { Router } = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const beneficiaryController = require("../controllers/beneficiary.controller");

const beneficiaryRouter = Router();

// All beneficiary routes require authentication
beneficiaryRouter.use(authMiddleware);

beneficiaryRouter.get("/", beneficiaryController.getBeneficiaries);
beneficiaryRouter.post("/", beneficiaryController.addBeneficiary);
beneficiaryRouter.delete("/:id", beneficiaryController.deleteBeneficiary);

module.exports = beneficiaryRouter;
