import express from "express"
import { body } from "express-validator"
import * as etudiantsController from "../controllers/etudiants.controller.js"
import { verifierAuth, verifierRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation pour la création et la mise à jour d'un étudiant
const etudiantValidation = [
  body("nom").notEmpty().withMessage("Le nom est requis"),
  body("prenom").notEmpty().withMessage("Le prénom est requis"),
  body("email").isEmail().withMessage("Email invalide"),
  body("motDePasse")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caractères")
    .optional({ nullable: true }),
  body("dateNaissance").isISO8601().withMessage("Date de naissance invalide"),
]

// Validation pour l'ajout d'une note
const noteValidation = [
  body("cours").notEmpty().withMessage("Le cours est requis"),
  body("valeur").isFloat({ min: 0, max: 20 }).withMessage("La note doit être entre 0 et 20"),
]

// Validation pour l'ajout d'une absence
const absenceValidation = [
  body("date").isISO8601().withMessage("Date invalide"),
  body("justifiee").isBoolean().withMessage("Justifiée doit être un booléen"),
]

// Routes pour les étudiants
router.get("/", verifierAuth, etudiantsController.getEtudiants)
router.get("/:id", verifierAuth, etudiantsController.getEtudiantById)
router.post("/", verifierAuth, verifierRole(["admin"]), etudiantValidation, etudiantsController.createEtudiant)
router.put("/:id", verifierAuth, verifierRole(["admin"]), etudiantValidation, etudiantsController.updateEtudiant)
router.delete("/:id", verifierAuth, verifierRole(["admin"]), etudiantsController.deleteEtudiant)

// Routes pour les notes et absences
router.post(
  "/:id/notes",
  verifierAuth,
  verifierRole(["admin", "professeur"]),
  noteValidation,
  etudiantsController.ajouterNote,
)
router.post(
  "/:id/absences",
  verifierAuth,
  verifierRole(["admin", "professeur"]),
  absenceValidation,
  etudiantsController.ajouterAbsence,
)

export default router

