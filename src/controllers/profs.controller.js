import Professeur from "../models/Professeur.js"
import Cours from "../models/Cours.js"
import Classe from "../models/Classe.js"
import { validationResult } from "express-validator"

// Récupérer tous les professeurs
export const getProfesseurs = async (req, res) => {
  try {
    const professeurs = await Professeur.find()
      .select("-motDePasse")
      .populate("cours", "nom matiere")
      .populate("classesPrincipales", "nom niveau")

    res.status(200).json(professeurs)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des professeurs", error: error.message })
  }
}

// Récupérer un professeur par ID
export const getProfesseurById = async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.params.id)
      .select("-motDePasse")
      .populate("cours", "nom matiere coefficient")
      .populate("classesPrincipales", "nom niveau anneeScolaire")

    if (!professeur) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    res.status(200).json(professeur)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du professeur", error: error.message })
  }
}

// Créer un nouveau professeur
export const createProfesseur = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, ...autresDonnees } = req.body

    // Vérifier si l'email est déjà utilisé
    const professeurExistant = await Professeur.findOne({ email })
    if (professeurExistant) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" })
    }

    // Créer le nouveau professeur
    const nouveauProfesseur = new Professeur({
      email,
      ...autresDonnees,
    })

    const professeurSauvegarde = await nouveauProfesseur.save()

    res.status(201).json({
      ...professeurSauvegarde.toObject(),
      motDePasse: undefined,
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du professeur", error: error.message })
  }
}

// Mettre à jour un professeur
export const updateProfesseur = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const professeurModifie = await Professeur.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-motDePasse")

    if (!professeurModifie) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    res.status(200).json(professeurModifie)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du professeur", error: error.message })
  }
}

// Supprimer un professeur
export const deleteProfesseur = async (req, res) => {
  try {
    const professeur = await Professeur.findById(req.params.id)

    if (!professeur) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    // Mettre à jour les cours enseignés par ce professeur
    await Cours.updateMany({ professeur: professeur._id }, { $unset: { professeur: 1 } })

    // Mettre à jour les classes dont ce professeur est le principal
    await Classe.updateMany({ professeurPrincipal: professeur._id }, { $unset: { professeurPrincipal: 1 } })

    // Supprimer le professeur
    await Professeur.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: "Professeur supprimé avec succès" })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du professeur", error: error.message })
  }
}

// Assigner un cours à un professeur
export const assignerCours = async (req, res) => {
  try {
    const { professeurId, coursId } = req.params

    const professeur = await Professeur.findById(professeurId)
    if (!professeur) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    const cours = await Cours.findById(coursId)
    if (!cours) {
      return res.status(404).json({ message: "Cours non trouvé" })
    }

    // Vérifier si le cours est déjà assigné au professeur
    if (professeur.cours.includes(coursId)) {
      return res.status(400).json({ message: "Ce cours est déjà assigné à ce professeur" })
    }

    // Assigner le cours au professeur
    professeur.cours.push(coursId)
    await professeur.save()

    // Mettre à jour le professeur du cours
    cours.professeur = professeurId
    await cours.save()

    res.status(200).json({ message: "Cours assigné au professeur avec succès", professeur })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'assignation du cours", error: error.message })
  }
}

// Désassigner un cours d'un professeur
export const desassignerCours = async (req, res) => {
  try {
    const { professeurId, coursId } = req.params

    const professeur = await Professeur.findById(professeurId)
    if (!professeur) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    const cours = await Cours.findById(coursId)
    if (!cours) {
      return res.status(404).json({ message: "Cours non trouvé" })
    }

    // Vérifier si le cours est assigné au professeur
    if (!professeur.cours.includes(coursId)) {
      return res.status(400).json({ message: "Ce cours n'est pas assigné à ce professeur" })
    }

    // Désassigner le cours du professeur
    professeur.cours = professeur.cours.filter((id) => id.toString() !== coursId)
    await professeur.save()

    // Mettre à jour le professeur du cours
    cours.professeur = undefined
    await cours.save()

    res.status(200).json({ message: "Cours désassigné du professeur avec succès", professeur })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la désassignation du cours", error: error.message })
  }
}

