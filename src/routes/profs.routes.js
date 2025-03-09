import express from "express"
import { body } from "express-validator"
import * as profsController from "../controllers/profs.controller.js"
import { verifierAuth, verifierRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation pour la création et la mise à jour d'un professeur
const professeurValidation = [
  body("nom").notEmpty().withMessage("Le nom est requis"),
  body("prenom").notEmpty().withMessage("Le prénom est requis"),
  body("email").isEmail().withMessage("Email invalide"),
  body("motDePasse")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    .optional({ nullable: true }),
  body("specialite").notEmpty().withMessage("La spécialité est requise"),
  body("dateEmbauche").isISO8601().withMessage("Date d'embauche invalide"),
]

// Routes pour les professeurs
router.get("/", verifierAuth, profsController.getProfesseurs)
router.get("/:id", verifierAuth, profsController.getProfesseurById)
router.post("/", verifierAuth, verifierRole(["admin"]), professeurValidation, profsController.createProfesseur)
router.put("/:id", verifierAuth, verifierRole(["admin"]), professeurValidation, profsController.updateProfesseur)
router.delete("/:id", verifierAuth, verifierRole(["admin"]), profsController.deleteProfesseur)

// Routes pour gérer les cours d'un professeur
router.post("/:professeurId/cours/:coursId", verifierAuth, verifierRole(["admin"]), profsController.assignerCours)
router.delete("/:professeurId/cours/:coursId", verifierAuth, verifierRole(["admin"]), profsController.desassignerCours)

export default router

