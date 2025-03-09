import EmploiDuTemps from "../models/EmploiDuTemps.js"
import Classe from "../models/Classe.js"
import Cours from "../models/Cours.js"
import Professeur from "../models/Professeur.js"
import { validationResult } from "express-validator"

// Récupérer tous les emplois du temps
export const getEmploisDuTemps = async (req, res) => {
  try {
    const emploisDuTemps = await EmploiDuTemps.find()
      .populate("classe", "nom niveau")
      .populate({
        path: "seances.cours",
        select: "nom matiere",
      })
      .populate({
        path: "seances.professeur",
        select: "nom prenom",
      })

    res.status(200).json(emploisDuTemps)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des emplois du temps", error: error.message })
  }
}

// Récupérer un emploi du temps par ID
export const getEmploiDuTempsById = async (req, res) => {
  try {
    const emploiDuTemps = await EmploiDuTemps.findById(req.params.id)
      .populate("classe", "nom niveau anneeScolaire")
      .populate({
        path: "seances.cours",
        select: "nom matiere duree",
      })
      .populate({
        path: "seances.professeur",
        select: "nom prenom specialite",
      })

    if (!emploiDuTemps) {
      return res.status(404).json({ message: "Emploi du temps non trouvé" })
    }

    res.status(200).json(emploiDuTemps)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'emploi du temps", error: error.message })
  }
}

// Récupérer l'emploi du temps d'une classe
export const getEmploiDuTempsParClasse = async (req, res) => {
  try {
    const { classeId, semaine, annee } = req.params

    const classe = await Classe.findById(classeId)
    if (!classe) {
      return res.status(404).json({ message: "Classe non trouvée" })
    }

    const query = { classe: classeId }
    if (semaine) query.semaine = semaine
    if (annee) query.annee = annee

    const emploiDuTemps = await EmploiDuTemps.findOne(query)
      .populate("classe", "nom niveau anneeScolaire")
      .populate({
        path: "seances.cours",
        select: "nom matiere duree",
      })
      .populate({
        path: "seances.professeur",
        select: "nom prenom specialite",
      })

    if (!emploiDuTemps) {
      return res.status(404).json({ message: "Emploi du temps non trouvé pour cette classe" })
    }

    res.status(200).json(emploiDuTemps)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'emploi du temps", error: error.message })
  }
}

// Créer un nouvel emploi du temps
export const createEmploiDuTemps = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { classe, semaine, annee, seances } = req.body

    // Vérifier si la classe existe
    const classeExiste = await Classe.findById(classe)
    if (!classeExiste) {
      return res.status(404).json({ message: "Classe non trouvée" })
    }

    // Vérifier si un emploi du temps existe déjà pour cette classe, semaine et année
    const emploiDuTempsExistant = await EmploiDuTemps.findOne({ classe, semaine, annee })
    if (emploiDuTempsExistant) {
      return res.status(400).json({ message: "Un emploi du temps existe déjà pour cette classe, semaine et année" })
    }

    // Vérifier la validité des séances
    for (const seance of seances) {
      // Vérifier si le cours existe
      const coursExiste = await Cours.findById(seance.cours)
      if (!coursExiste) {
        return res.status(404).json({ message: `Cours non trouvé: ${seance.cours}` })
      }

      // Vérifier si le professeur existe
      const professeurExiste = await Professeur.findById(seance.professeur)
      if (!professeurExiste) {
        return res.status(404).json({ message: `Professeur non trouvé: ${seance.professeur}` })
      }

      // Vérifier si le professeur enseigne ce cours
      if (!professeurExiste.cours.includes(seance.cours)) {
        return res.status(400).json({ message: `Le professeur ${professeurExiste.nom} n'enseigne pas ce cours` })
      }
    }

    // Créer le nouvel emploi du temps
    const nouvelEmploiDuTemps = new EmploiDuTemps({
      classe,
      semaine,
      annee,
      seances,
    })

    const emploiDuTempsSauvegarde = await nouvelEmploiDuTemps.save()

    res.status(201).json(emploiDuTempsSauvegarde)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'emploi du temps", error: error.message })
  }
}

// Mettre à jour un emploi du temps
export const updateEmploiDuTemps = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { seances } = req.body

    // Récupérer l'emploi du temps actuel
    const emploiDuTempsActuel = await EmploiDuTemps.findById(req.params.id)
    if (!emploiDuTempsActuel) {
      return res.status(404).json({ message: "Emploi du temps non trouvé" })
    }

    // Vérifier la validité des séances
    if (seances) {
      for (const seance of seances) {
        // Vérifier si le cours existe
        const coursExiste = await Cours.findById(seance.cours)
        if (!coursExiste) {
          return res.status(404).json({ message: `Cours non trouvé: ${seance.cours}` })
        }

        // Vérifier si le professeur existe
        const professeurExiste = await Professeur.findById(seance.professeur)
        if (!professeurExiste) {
          return res.status(404).json({ message: `Professeur non trouvé: ${seance.professeur}` })
        }

        // Vérifier si le professeur enseigne ce cours
        if (!professeurExiste.cours.includes(seance.cours)) {
          return res.status(400).json({ message: `Le professeur ${professeurExiste.nom} n'enseigne pas ce cours` })
        }
      }
    }

    // Mettre à jour l'emploi du temps
    const emploiDuTempsModifie = await EmploiDuTemps.findByIdAndUpdate(
      req.params.id,
      { seances },
      { new: true, runValidators: true },
    )

    res.status(200).json(emploiDuTempsModifie)
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'emploi du temps", error: error.message })
  }
}

// Supprimer un emploi du temps
export const deleteEmploiDuTemps = async (req, res) => {
  try {
    const emploiDuTemps = await EmploiDuTemps.findById(req.params.id)

    if (!emploiDuTemps) {
      return res.status(404).json({ message: "Emploi du temps non trouvé" })
    }

    // Supprimer l'emploi du temps
    await EmploiDuTemps.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: "Emploi du temps supprimé avec succès" })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'emploi du temps", error: error.message })
  }
}

// Ajouter une séance à un emploi du temps
export const ajouterSeance = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { jour, heureDebut, heureFin, cours, professeur, salle } = req.body

    const emploiDuTemps = await EmploiDuTemps.findById(req.params.id)
    if (!emploiDuTemps) {
      return res.status(404).json({ message: "Emploi du temps non trouvé" })
    }

    // Vérifier si le cours existe
    const coursExiste = await Cours.findById(cours)
    if (!coursExiste) {
      return res.status(404).json({ message: "Cours non trouvé" })
    }

    // Vérifier si le professeur existe
    const professeurExiste = await Professeur.findById(professeur)
    if (!professeurExiste) {
      return res.status(404).json({ message: "Professeur non trouvé" })
    }

    // Vérifier si le professeur enseigne ce cours
    if (!professeurExiste.cours.includes(cours)) {
      return res.status(400).json({ message: `Le professeur ${professeurExiste.nom} n'enseigne pas ce cours` })
    }

    // Vérifier s'il y a un conflit d'horaire
    const conflit = emploiDuTemps.seances.some((seance) => {
      return (
        seance.jour === jour &&
        ((heureDebut >= seance.heureDebut && heureDebut < seance.heureFin) ||
          (heureFin > seance.heureDebut && heureFin <= seance.heureFin) ||
          (heureDebut <= seance.heureDebut && heureFin >= seance.heureFin))
      )
    })

    if (conflit) {
      return res.status(400).json({ message: "Il y a un conflit d'horaire avec une autre séance" })
    }

    // Ajouter la séance
    emploiDuTemps.seances.push({
      jour,
      heureDebut,
      heureFin,
      cours,
      professeur,
      salle,
    })

    await emploiDuTemps.save()

    res.status(200).json({ message: "Séance ajoutée avec succès", emploiDuTemps })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de la séance", error: error.message })
  }
}

// Supprimer une séance d'un emploi du temps
export const supprimerSeance = async (req, res) => {
  try {
    const { id, seanceId } = req.params

    const emploiDuTemps = await EmploiDuTemps.findById(id)
    if (!emploiDuTemps) {
      return res.status(404).json({ message: "Emploi du temps non trouvé" })
    }

    // Vérifier si la séance existe
    const seanceIndex = emploiDuTemps.seances.findIndex((seance) => seance._id.toString() === seanceId)
    if (seanceIndex === -1) {
      return res.status(404).json({ message: "Séance non trouvée" })
    }

    // Supprimer la séance
    emploiDuTemps.seances.splice(seanceIndex, 1)
    await emploiDuTemps.save()

    res.status(200).json({ message: "Séance supprimée avec succès", emploiDuTemps })
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la séance", error: error.message })
  }
}

