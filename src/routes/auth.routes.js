import express from "express"
import { body } from "express-validator"
import * as authController from "../controllers/auth.controller.js"
import { verifierAuth } from "../middleware/auth.middleware.js"

const router = express.Router()

// Validation pour l'inscription
const registerValidation = [
  body("nom").notEmpty().withMessage("Le nom est requis"),
  body("prenom").notEmpty().withMessage("Le prénom est requis"),
  body("email").isEmail().withMessage("Email invalide"),
  body("motDePasse").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères"),
  body("role").isIn(["admin", "professeur", "etudiant"]).withMessage("Rôle invalide"),
]

// Validation pour la connexion
const loginValidation = [
  body("email").isEmail().withMessage("Email invalide"),
  body("motDePasse").notEmpty().withMessage("Le mot de passe est requis"),
]

// Routes d'authentification
router.post("/register", registerValidation, authController.register)
router.post("/login", loginValidation, authController.login)
router.get("/profile", verifierAuth, authController.getProfile)

export default router

