import express from "express"
import { body } from "express-validator"
import * as emploiDuTempsController from "../controllers/emploi-du-temps.controller.js"
import { verifierAuth, verifierRole } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation pour la création d'un emploi du temps
const emploiDuTempsValidation = [
  body("classe").notEmpty().withMessage("La classe est requise"),
  body("semaine").isInt({ min: 1, max: 53 }).withMessage("La semaine doit être entre 1 et 53"),
  body("annee").isInt({ min: 2000 }).withMessage("L'année doit être valide"),
  body("seances").isArray().withMessage("Les séances doivent être un tableau"),
]

// Validation pour l'ajout d'une séance
const seanceValidation = [
  body("jour").isIn(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]).withMessage("Jour invalide"),
  body("heureDebut")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Format d'heure de début invalide (HH:MM)"),
  body("heureFin")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Format d'heure de fin invalide (HH:MM)"),
  body("cours").notEmpty().withMessage("Le cours est requis"),
  body("professeur").notEmpty().withMessage("Le professeur est requis"),
  body("salle").notEmpty().withMessage("La salle est requise"),
]

// Routes pour les emplois du temps
router.get("/", verifierAuth, emploiDuTempsController.getEmploisDuTemps)
router.get("/:id", verifierAuth, emploiDuTempsController.getEmploiDuTempsById)
router.get("/classe/:classeId", verifierAuth, emploiDuTempsController.getEmploiDuTempsParClasse)
router.get(
  "/classe/:classeId/semaine/:semaine/annee/:annee",
  verifierAuth,
  emploiDuTempsController.getEmploiDuTempsParClasse,
)
router.post(
  "/",
  verifierAuth,
  verifierRole(["admin"]),
  emploiDuTempsValidation,
  emploiDuTempsController.createEmploiDuTemps,
)
router.put("/:id", verifierAuth, verifierRole(["admin"]), emploiDuTempsController.updateEmploiDuTemps)
router.delete("/:id", verifierAuth, verifierRole(["admin"]), emploiDuTempsController.deleteEmploiDuTemps)

// Routes pour gérer les séances
router.post(
  "/:id/seances",
  verifierAuth,
  verifierRole(["admin"]),
  seanceValidation,
  emploiDuTempsController.ajouterSeance,
)
router.delete("/:id/seances/:seanceId", verifierAuth, verifierRole(["admin"]), emploiDuTempsController.supprimerSeance)

export default router

