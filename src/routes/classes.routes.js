import express from "express"
import { body } from "express-validator"
import * as classesController from "../controllers/classes.controller.js"
import { verifierAuth, verifierRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation pour la création et la mise à jour d'une classe
const classeValidation = [
  body("nom").notEmpty().withMessage("Le nom de la classe est requis"),
  body("niveau").notEmpty().withMessage("Le niveau est requis"),
  body("anneeScolaire").notEmpty().withMessage("L'année scolaire est requise"),
  body("capaciteMax").isInt({ min: 1 }).withMessage("La capacité maximale doit être un nombre positif"),
]

// Routes pour les classes
router.get("/", verifierAuth, classesController.getClasses)
router.get("/:id", verifierAuth, classesController.getClasseById)
router.post("/", verifierAuth, verifierRole(["admin"]), classeValidation, classesController.createClasse)
router.put("/:id", verifierAuth, verifierRole(["admin"]), classeValidation, classesController.updateClasse)
router.delete("/:id", verifierAuth, verifierRole(["admin"]), classesController.deleteClasse)

// Routes pour gérer les étudiants dans une classe
router.post(
  "/:classeId/etudiants/:etudiantId",
  verifierAuth,
  verifierRole(["admin"]),
  classesController.ajouterEtudiant,
)
router.delete(
  "/:classeId/etudiants/:etudiantId",
  verifierAuth,
  verifierRole(["admin"]),
  classesController.retirerEtudiant,
)

export default router

