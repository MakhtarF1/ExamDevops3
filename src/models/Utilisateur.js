import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const utilisateurSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ["admin", "professeur", "etudiant"],
      default: "etudiant",
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "profileModel",
    },
    profileModel: {
      type: String,
      enum: ["Etudiant", "Professeur"],
      required: function () {
        return this.role !== "admin"
      },
    },
  },
  {
    timestamps: true,
  },
)

// Middleware pour hacher le mot de passe avant de sauvegarder
utilisateurSchema.pre("save", async function (next) {
  if (this.isModified("motDePasse")) {
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10)
  }
  next()
})

// Méthode pour vérifier le mot de passe
utilisateurSchema.methods.verifierMotDePasse = async function (motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse)
}

const Utilisateur = mongoose.model("Utilisateur", utilisateurSchema)

export default Utilisateur

