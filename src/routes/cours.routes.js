import express from "express"
import { body } from "express-validator"
import * as coursController from "../controllers/cours.controller.js"
import { verifierAuth, verifierRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation pour la création et la mise à jour d'un cours
const coursValidation = [
  body("nom").notEmpty().withMessage("Le nom du cours est requis"),
  body("matiere").notEmpty().withMessage("La matière est requise"),
  body("coefficient").isFloat({ min: 0.1 }).withMessage("Le coefficient doit être un nombre positif"),
  body("professeur").notEmpty().withMessage("Le professeur est requis"),
  body("duree").isInt({ min: 1 }).withMessage("La durée doit être un nombre positif"),
]

// Routes pour les cours
router.get("/", verifierAuth, coursController.getCours)
router.get("/:id", verifierAuth, coursController.getCoursById)
router.post("/", verifierAuth, verifierRole(["admin"]), coursValidation, coursController.createCours)
router.put("/:id", verifierAuth, verifierRole(["admin", "professeur"]), coursValidation, coursController.updateCours)
router.delete("/:id", verifierAuth, verifierRole(["admin"]), coursController.deleteCours)

export default router

