import mongoose from "mongoose"

const coursSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    matiere: {
      type: String,
      required: true,
      trim: true,
    },
    coefficient: {
      type: Number,
      required: true,
      default: 1,
    },
    professeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professeur",
      required: true,
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classe",
      },
    ],
    duree: {
      type: Number, // en minutes
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const Cours = mongoose.model("Cours", coursSchema)

export default Cours

