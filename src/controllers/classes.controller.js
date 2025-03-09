import Classe from "../models/Classe.js";
import Etudiant from "../models/Etudiant.js";
import { validationResult } from "express-validator";

// Récupérer toutes les classes avec les détails des relations
export const getClasses = async (req, res) => {
  try {
    const classes = await Classe.find()
      .populate("professeurPrincipal")
      .populate("etudiants")
      .populate("cours");

    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des classes", error: error.message });
  }
};

// Récupérer une classe par ID avec les détails des relations
export const getClasseById = async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id)
      .populate("professeurPrincipal")
      .populate("etudiants")
      .populate("cours");

    if (!classe) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    res.status(200).json(classe);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de la classe", error: error.message });
  }
};

// Créer une nouvelle classe
export const createClasse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const nouvelleClasse = new Classe(req.body);
    const classeSauvegardee = await nouvelleClasse.save();
    
    const classeComplete = await Classe.findById(classeSauvegardee._id)
      .populate("professeurPrincipal")
      .populate("etudiants")
      .populate("cours");

    res.status(201).json(classeComplete);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de la classe", error: error.message });
  }
};

// Mettre à jour une classe
export const updateClasse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const classeModifiee = await Classe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("professeurPrincipal")
      .populate("etudiants")
      .populate("cours");

    if (!classeModifiee) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    res.status(200).json(classeModifiee);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de la classe", error: error.message });
  }
};

// Supprimer une classe
export const deleteClasse = async (req, res) => {
  try {
    const classeSupprimee = await Classe.findByIdAndDelete(req.params.id);

    if (!classeSupprimee) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    await Etudiant.updateMany({ classe: req.params.id }, { $unset: { classe: 1 } });

    res.status(200).json({ message: "Classe supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de la classe", error: error.message });
  }
};

// Ajouter un étudiant à une classe
export const ajouterEtudiant = async (req, res) => {
  try {
    const { classeId, etudiantId } = req.params;

    const classe = await Classe.findById(classeId);
    if (!classe) return res.status(404).json({ message: "Classe non trouvée" });

    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) return res.status(404).json({ message: "Étudiant non trouvé" });

    if (classe.etudiants.includes(etudiantId)) {
      return res.status(400).json({ message: "L'étudiant est déjà dans cette classe" });
    }

    if (classe.etudiants.length >= classe.capaciteMax) {
      return res.status(400).json({ message: "La classe a atteint sa capacité maximale" });
    }

    classe.etudiants.push(etudiantId);
    await classe.save();

    etudiant.classe = classeId;
    await etudiant.save();

    const classeComplete = await Classe.findById(classeId).populate("etudiants");
    res.status(200).json({ message: "Étudiant ajouté avec succès", classe: classeComplete });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'étudiant", error: error.message });
  }
};

// Retirer un étudiant d'une classe
export const retirerEtudiant = async (req, res) => {
  try {
    const { classeId, etudiantId } = req.params;

    const classe = await Classe.findById(classeId);
    if (!classe) return res.status(404).json({ message: "Classe non trouvée" });

    const etudiant = await Etudiant.findById(etudiantId);
    if (!etudiant) return res.status(404).json({ message: "Étudiant non trouvé" });

    if (!classe.etudiants.includes(etudiantId)) {
      return res.status(400).json({ message: "L'étudiant n'est pas dans cette classe" });
    }

    classe.etudiants = classe.etudiants.filter(id => id.toString() !== etudiantId);
    await classe.save();

    etudiant.classe = undefined;
    await etudiant.save();

    const classeComplete = await Classe.findById(classeId).populate("etudiants");
    res.status(200).json({ message: "Étudiant retiré avec succès", classe: classeComplete });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du retrait de l'étudiant", error: error.message });
  }
};
