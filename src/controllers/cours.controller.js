import Cours from "../models/Cours.js"
import Professeur from "../models/Professeur.js"
import Classe from "../models/Classe.js"
import { validationResult } from "express-validator"

// Récupérer tous les cours
export const getCours = async (req, res) => {
  try {
    const cours = await Cours.find().populate("professeur", "nom prenom").populate("classes", "nom niveau")

    res.status(200).json(cours)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des cours", error: error.message })
  }
}

// Récupérer un cours par ID
export const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id)
      .populate("professeur", "nom prenom email specialite")
      .populate("classes", "nom niveau")

    if (!cours) {
      return res.status(404).json({ message: "Cours non trouvé" })
    }

    res.status(200).json(cours)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du cours", error: error.message })
  }
}

// Créer un nouveau cours
export const createCours = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { professeur, classes, ...autresDonnees } = req.body

    // Vérifier si le professeur existe
    const professeurExiste = await Professeur.findById(professeur)
    if (!professeurExiste) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    // Créer le nouveau cours
    const nouveauCours = new Cours({
      ...autresDonnees,
      professeur,
      classes: classes || [],
    })

    const coursSauvegarde = await nouveauCours.save()

    // Ajouter le cours au professeur
    professeurExiste.cours.push(coursSauvegarde._id)
    await professeurExiste.save()

    // Ajouter le cours aux classes
    if (classes && classes.length > 0) {
      for (const classeId of classes) {
        const classe = await Classe.findById(classeId)
        if (classe) {
          classe.cours.push(coursSauvegarde._id)
          await classe.save()
        }
      }
    }

    res.status(201).json(coursSauvegarde)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du cours", error: error.message })
  }
}

// Mettre à jour un cours
export const updateCours = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { professeur, classes, ...autresDonnees } = req.body

    // Récupérer le cours actuel
    const coursActuel = await Cours.findById(req.params.id)
    if (!coursActuel) {
      return res.status(404).json({ message: "Cours non trouvé" })
    }

    // Si le professeur a changé
    if (professeur && professeur !== coursActuel.professeur.toString()) {
      // Retirer le cours de l'ancien professeur
      await Professeur.findByIdAndUpdate(coursActuel.professeur, { $pull: { cours: coursActuel._id } })

      // Ajouter le cours au nouveau professeur
      await Professeur.findByIdAndUpdate(professeur, { $addToSet: { cours: coursActuel._id } })
    }

    // Si les classes ont changé
    if (classes) {
      // Classes à retirer
      const classesARetirer = coursActuel.classes.filter((classeId) => !classes.includes(classeId.toString()))

      // Classes à ajouter
      const classesAAjouter = classes.filter((classeId) => !coursActuel.classes.includes(classeId))

      // Retirer le cours des classes qui ne sont plus associées
      for (const classeId of classesARetirer) {
        await Classe.findByIdAndUpdate(classeId, { $pull: { cours: coursActuel._id } })
      }

      // Ajouter le cours aux nouvelles classes
      for (const classeId of classesAAjouter) {
        await Classe.findByIdAndUpdate(classeId, { $addToSet: { cours: coursActuel._id } })
      }
    }

    // Mettre à jour le cours
    const coursModifie = await Cours.findByIdAndUpdate(
      req.params.id,
      { ...autresDonnees, professeur, classes },
      { new: true, runValidators: true },
    )

    res.status(200).json(coursModifie)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du cours", error: error.message })
  }
}

// Supprimer un cours
export const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id)

    if (!cours) {
      return res.status(404).json({ message: "Cours non trouvé" })
    }

    // Retirer le cours du professeur
    await Professeur.findByIdAndUpdate(cours.professeur, { $pull: { cours: cours._id } })

    // Retirer le cours des classes
    for (const classeId of cours.classes) {
      await Classe.findByIdAndUpdate(classeId, { $pull: { cours: cours._id } })
    }

    // Supprimer le cours
    await Cours.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: "Cours supprimé avec succès" })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du cours", error: error.message })
  }
}

