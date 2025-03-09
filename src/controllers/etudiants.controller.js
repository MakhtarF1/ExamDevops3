import Etudiant from "../models/Etudiant.js"
import Classe from "../models/Classe.js"
import { validationResult } from "express-validator"

// Récupérer tous les étudiants
export const getEtudiants = async (req, res) => {
  try {
    const etudiants = await Etudiant.find().select("-motDePasse").populate("classe", "nom niveau")

    res.status(200).json(etudiants)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des étudiants", error: error.message })
  }
}

// Récupérer un étudiant par ID
export const getEtudiantById = async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id)
      .select("-motDePasse")
      .populate("classe", "nom niveau anneeScolaire")
      .populate("notes.cours", "nom matiere")

    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé" })
    }

    res.status(200).json(etudiant)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'étudiant", error: error.message })
  }
}

// Créer un nouvel étudiant
export const createEtudiant = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, classe, ...autresDonnees } = req.body

    // Vérifier si l'email est déjà utilisé
    const etudiantExistant = await Etudiant.findOne({ email })
    if (etudiantExistant) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" })
    }

    // Créer le nouvel étudiant
    const nouvelEtudiant = new Etudiant({
      email,
      ...autresDonnees,
      classe: classe || null,
    })

    const etudiantSauvegarde = await nouvelEtudiant.save()

    // Si une classe est spécifiée, ajouter l'étudiant à cette classe
    if (classe) {
      const classeObj = await Classe.findById(classe)
      if (classeObj) {
        // Vérifier si la classe n'est pas déjà pleine
        if (classeObj.etudiants.length >= classeObj.capaciteMax) {
          return res.status(400).json({ message: "La classe a atteint sa capacité maximale" })
        }

        classeObj.etudiants.push(etudiantSauvegarde._id)
        await classeObj.save()
      }
    }

    res.status(201).json({
      ...etudiantSauvegarde.toObject(),
      motDePasse: undefined,
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'étudiant", error: error.message })
  }
}

// Mettre à jour un étudiant
export const updateEtudiant = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { classe, ...autresDonnees } = req.body

    // Récupérer l'étudiant actuel
    const etudiantActuel = await Etudiant.findById(req.params.id)
    if (!etudiantActuel) {
      return res.status(404).json({ message: "Étudiant non trouvé" })
    }

    // Si la classe a changé
    if (classe !== undefined && classe !== etudiantActuel.classe) {
      // Retirer l'étudiant de l'ancienne classe
      if (etudiantActuel.classe) {
        await Classe.findByIdAndUpdate(etudiantActuel.classe, { $pull: { etudiants: etudiantActuel._id } })
      }

      // Ajouter l'étudiant à la nouvelle classe
      if (classe) {
        const nouvelleClasse = await Classe.findById(classe)
        if (nouvelleClasse) {
          // Vérifier si la classe n'est pas déjà pleine
          if (nouvelleClasse.etudiants.length >= nouvelleClasse.capaciteMax) {
            return res.status(400).json({ message: "La classe a atteint sa capacité maximale" })
          }

          nouvelleClasse.etudiants.push(etudiantActuel._id)
          await nouvelleClasse.save()
        }
      }
    }

    // Mettre à jour l'étudiant
    const etudiantModifie = await Etudiant.findByIdAndUpdate(
      req.params.id,
      { ...autresDonnees, classe },
      { new: true, runValidators: true },
    ).select("-motDePasse")

    res.status(200).json(etudiantModifie)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'étudiant", error: error.message })
  }
}

// Supprimer un étudiant
export const deleteEtudiant = async (req, res) => {
  try {
    const etudiant = await Etudiant.findById(req.params.id)

    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé" })
    }

    // Retirer l'étudiant de sa classe
    if (etudiant.classe) {
      await Classe.findByIdAndUpdate(etudiant.classe, { $pull: { etudiants: etudiant._id } })
    }

    // Supprimer l'étudiant
    await Etudiant.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: "Étudiant supprimé avec succès" })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'étudiant", error: error.message })
  }
}

// Ajouter une note à un étudiant
export const ajouterNote = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { cours, valeur, date } = req.body

    const etudiant = await Etudiant.findById(req.params.id)
    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé" })
    }

    // Ajouter la note
    etudiant.notes.push({
      cours,
      valeur,
      date: date || new Date(),
    })

    await etudiant.save()

    res.status(200).json({
      message: "Note ajoutée avec succès",
      etudiant: {
        ...etudiant.toObject(),
        motDePasse: undefined,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de la note", error: error.message })
  }
}

// Ajouter une absence à un étudiant
export const ajouterAbsence = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { date, justifiee, motif } = req.body

    const etudiant = await Etudiant.findById(req.params.id)
    if (!etudiant) {
      return res.status(404).json({ message: "Étudiant non trouvé" })
    }

    // Ajouter l'absence
    etudiant.absences.push({
      date: date || new Date(),
      justifiee: justifiee || false,
      motif: motif || "",
    })

    await etudiant.save()

    res.status(200).json({
      message: "Absence ajoutée avec succès",
      etudiant: {
        ...etudiant.toObject(),
        motDePasse: undefined,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'absence", error: error.message })
  }
}

