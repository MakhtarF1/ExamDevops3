import mongoose from "mongoose"

const classeSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    niveau: {
      type: String,
      required: true,
      trim: true,
    },
    anneeScolaire: {
      type: String,
      required: true,
    },
    capaciteMax: {
      type: Number,
      required: true,
    },
    etudiants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Etudiant",
      },
    ],
    professeurPrincipal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professeur",
    },
    cours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cours",
      },
    ],
  },
  {
    timestamps: true,
  },
)

const Classe = mongoose.model("Classe", classeSchema)

export default Classe

