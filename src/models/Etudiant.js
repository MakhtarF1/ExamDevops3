import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const etudiantSchema = new mongoose.Schema(
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
    dateNaissance: {
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
    classe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classe",
    },
    notes: [
      {
        cours: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Cours",
        },
        valeur: Number,
        date: Date,
      },
    ],
    absences: [
      {
        date: Date,
        justifiee: Boolean,
        motif: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Middleware pour hacher le mot de passe avant de sauvegarder
etudiantSchema.pre("save", async function (next) {
  if (this.isModified("motDePasse")) {
    this.motDePasse = await bcrypt.hash(this.motDePasse, 10)
  }
  next()
})

// Méthode pour vérifier le mot de passe
etudiantSchema.methods.verifierMotDePasse = async function (motDePasse) {
  return await bcrypt.compare(motDePasse, this.motDePasse)
}

const Etudiant = mongoose.model("Etudiant", etudiantSchema)

export default Etudiant

