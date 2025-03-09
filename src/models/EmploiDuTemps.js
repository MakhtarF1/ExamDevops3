import mongoose from "mongoose"

const emploiDuTempsSchema = new mongoose.Schema(
  {
    classe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classe",
      required: true,
    },
    semaine: {
      type: Number,
      required: true,
    },
    annee: {
      type: Number,
      required: true,
    },
    seances: [
      {
        jour: {
          type: String,
          enum: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
          required: true,
        },
        heureDebut: {
          type: String,
          required: true,
        },
        heureFin: {
          type: String,
          required: true,
        },
        cours: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Cours",
          required: true,
        },
        professeur: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Professeur",
          required: true,
        },
        salle: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

const EmploiDuTemps = mongoose.model("EmploiDuTemps", emploiDuTempsSchema)

export default EmploiDuTemps

