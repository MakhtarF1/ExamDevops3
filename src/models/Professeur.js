import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const professeurSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    prenom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    motDePasse: {
      type: String,
      required: true,
    },
    specialite: {
      type: String,
      required: true,
      trim: true,
    },
    dateEmbauche: {
      type: Date,
      required: true,
    },
    adresse: {
      rue: String,
      ville: String,
      codePostal: String,
      pays: String,
    },
    telephone: String,
    cours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cours",
      },
    ],
    classesPrincipales: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classe",
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Middleware pour hacher le mot de passe avant de sauvegarder
professeurSchema.pre("save", async function (next) {
  if (this.isModified("motDePasse")) {
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10)
  }
  next()
})

// Méthode pour vérifier le mot de passe
professeurSchema.methods.verifierMotDePasse = async function (motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse)
}

const Professeur = mongoose.model("Professeur", professeurSchema)

export default Professeur

