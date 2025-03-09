import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import Utilisateur from "../models/Utilisateur.js"
import Etudiant from "../models/Etudiant.js"
import Professeur from "../models/Professeur.js"

// Inscription
export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { nom, prenom, email, motDePasse, role } = req.body

  try {
    // Vérifier si l'utilisateur existe déjà
    const utilisateurExistant = await Utilisateur.findOne({ email })
    if (utilisateurExistant) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" })
    }

    // Créer un nouvel utilisateur
    const nouvelUtilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      motDePasse,
      role,
    })

    // Si c'est un étudiant ou un professeur, créer le profil correspondant
    if (role === "etudiant") {
      const nouvelEtudiant = new Etudiant({
        nom,
        prenom,
        email,
        motDePasse,
        dateNaissance: req.body.dateNaissance || new Date(),
        adresse: req.body.adresse || {},
      })

      const etudiantSauvegarde = await nouvelEtudiant.save()
      nouvelUtilisateur.profileId = etudiantSauvegarde._id
      nouvelUtilisateur.profileModel = "Etudiant"
    } else if (role === "professeur") {
      const nouveauProfesseur = new Professeur({
        nom,
        prenom,
        email,
        motDePasse,
        specialite: req.body.specialite || "Non spécifié",
        dateEmbauche: req.body.dateEmbauche || new Date(),
        adresse: req.body.adresse || {},
      })

      const professeurSauvegarde = await nouveauProfesseur.save()
      nouvelUtilisateur.profileId = professeurSauvegarde._id
      nouvelUtilisateur.profileModel = "Professeur"
    }

    // Sauvegarder l'utilisateur
    await nouvelUtilisateur.save()

    // Générer un token JWT
    const token = jwt.sign({ id: nouvelUtilisateur._id, role: nouvelUtilisateur.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      utilisateur: {
        id: nouvelUtilisateur._id,
        nom: nouvelUtilisateur.nom,
        prenom: nouvelUtilisateur.prenom,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription", error: error.message })
  }
}

// Connexion
export const login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, motDePasse } = req.body

  try {
    // Trouver l'utilisateur par email
    const utilisateur = await Utilisateur.findOne({ email })
    if (!utilisateur) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" })
    }

    // Vérifier le mot de passe
    const motDePasseValide = await utilisateur.verifierMotDePasse(motDePasse)
    if (!motDePasseValide) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" })
    }

    // Générer un token JWT
    const token = jwt.sign({ id: utilisateur._id, role: utilisateur.role }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    })

    res.status(200).json({
      message: "Connexion réussie",
      token,
      utilisateur: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion", error: error.message })
  }
}

// Obtenir le profil de l'utilisateur connecté
export const getProfile = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id)
    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé" })
    }

    // Si l'utilisateur a un profil associé (étudiant ou professeur), le récupérer
    let profile = null
    if (utilisateur.profileId && utilisateur.profileModel) {
      if (utilisateur.profileModel === "Etudiant") {
        profile = await Etudiant.findById(utilisateur.profileId).populate("classe", "nom niveau").select("-motDePasse")
      } else if (utilisateur.profileModel === "Professeur") {
        profile = await Professeur.findById(utilisateur.profileId)
          .populate("cours", "nom matiere")
          .populate("classesPrincipales", "nom niveau")
          .select("-motDePasse")
      }
    }

    res.status(200).json({
      utilisateur: {
        id: utilisateur._id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
      },
      profile,
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du profil", error: error.message })
  }
}

