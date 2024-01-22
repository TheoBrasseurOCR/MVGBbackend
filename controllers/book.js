const sharp = require("sharp");
const path = require("path");
const Book = require("../models/book");
const fs = require("fs").promises;

exports.createBook = (req, res) => {
  //On transforme les données du corps de la requête en objet JSON
  const bookObject = JSON.parse(req.body.book);
  //On supprime le champ _id généré par MongoDB.
  delete bookObject._id;
  //On crée un livre en récupérant toutes les infos de la requête et en lui attribuant l'ID de l'utilisateur qui l'a crée, et on crée une URL pour l'image chargée.
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.sharpFileName
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.getAllBook = (req, res, next) => {
  Book.find()
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};

exports.modifyBook = async (req, res, next) => {
  try {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${
            req.file.filename
          }`,
        }
      : { ...req.body };

    // Utilisez sharp pour traiter l'image
    if (req.file) {
      const imageBuffer = await sharp(req.file.buffer)
        .resize({ width: 300, height: 400 }) // Ajustez la taille selon vos besoins
        .toBuffer();

      // Enregistrez l'image traitée
      await fs.writeFile(`images/${req.file.filename}`, imageBuffer);
    }

    // Mettez à jour le livre dans la base de données
    const updatedBook = await Book.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      { ...bookObject, _id: req.params.id },
      { new: true }
    );

    if (!updatedBook) {
      // Si le livre n'est pas trouvé ou l'utilisateur n'est pas autorisé
      return res
        .status(401)
        .json({ message: "Not authorized or Book not found" });
    }

    // Répondez à la requête avec le livre mis à jour
    res.status(200).json({ message: "Objet modifié!", book: updatedBook });
  } catch (error) {
    // Gérez les erreurs
    console.error(error);
    res
      .status(500)
      .json({ error: "Une erreur est survenue lors de la modification." });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId != req.auth.userId) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const filename = book.imageUrl.split("/images/")[1];
    // Supprimez l'image seulement si le nom de fichier est défini
    if (filename) {
      const imagePath = `images/${filename}`;
      // Utilisez fs.promises.unlink pour une opération asynchrone
      await fs.unlink(imagePath);
    }
    await Book.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Objet supprimé !" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Une erreur est survenue lors de la suppression." });
  }
};

exports.createRating = (req, res, next) => {
  if (0 <= req.body.rating <= 5) {
    const ratingObject = { ...req.body, grade: req.body.rating };
    delete ratingObject._id;

    Book.findOne({ _id: req.params.id })
      .then((book) => {
        const newRatings = book.ratings;
        const userIdArray = newRatings.map((rating) => rating.userId);

        if (userIdArray.includes(req.auth.userId)) {
          res.status(403).json({ message: "Not authorized" });
        } else {
          newRatings.push(ratingObject);
          const grades = newRatings.map((rating) => rating.grade);
          const averageGrades =
            grades.reduce((a, b) => a + b, 0) / grades.length; // Calcul de la moyenne

          book.averageRating = averageGrades;

          Book.updateOne(
            { _id: req.params.id },
            {
              ratings: newRatings,
              averageRating: averageGrades,
              _id: req.params.id,
            }
          )
            .then(() => res.status(201).json(book))
            .catch((error) => res.status(400).json({ error }));
        }
      })
      .catch((error) => {
        res.status(404).json({ error });
      });
  } else {
    res
      .status(400)
      .json({ message: "La note doit être comprise entre 1 et 5" });
  }
};

// GET => Récupération des 3 livres les mieux notés
exports.getBestRating = (req, res, next) => {
  // Récupération de tous les livres
  // Puis tri par rapport aux moyennes dans l'ordre décroissant, limitation du tableau aux 3 premiers éléments
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};
