const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado com sucesso"))
  .catch(err => console.log("Erro MongoDB:", err));

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  active: Boolean,
  token: String
});

module.exports = mongoose.model("User", UserSchema);
