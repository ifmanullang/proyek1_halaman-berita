var express = require("express");
var router = express.Router();
var multer = require("multer");
const moment = require("moment");
var bcrypt = require("bcryptjs");

const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "././public/images");
  },
  filename: (req, file, callback) => {
    callback(null, new Date().getTime() + "-" + file.originalname);
  },
});

const kirim = multer({
  storage: fileStorage,
});

const db = require("../models");
const { comment1s, comment2s } = require("../models");
const Berita = db.berita;
const Comment1s = db.comment1s;
const Comment2s = db.comment2s;
const User = db.users;

const Op = db.Sequelize.Op;

/* GET Halaman Utama */
router.get("/", function (req, res, next) {
  res.render("loginform", { title: "Daftar Berita" });
});

router.get("/berita", function (req, res, next) {
  Berita.findAll()
    .then((berita) => {
      res.render("berita", {
        title: "Daftar Berita",
        berita: berita,
      });
    })
    .catch((err) => {
      res.render("berita", {
        title: "Daftar Berita",
        berita: [],
      });
    });
});

router.get("/tambahberita", function (req, res, next) {
  res.render("tambahberita", { title: "Tambah Berita" });
});
router.post("/tambahberita", kirim.array("gambar", 1), function (req, res, next) {
  let gambar = req.files[0].filename;

  let berita = {
    judul: req.body.judul,
    deskripsi: req.body.deskripsi,
    isi: req.body.isi,
    gambar: gambar,
  };
  Berita.create(berita)
    .then((data) => {
      res.redirect("/berita");
    })
    .catch((err) => {
      res.render("tambahberita", {
        title: "Tambah Berita",
      });
    });
});

router.get("/baca/:id", async function (req, res, next) {
  var id = req.params.id;
  var nama = req.params.nama;
  const komentarr = await Comment1s.findAll({ where: { idberita: id } });
  await Berita.findByPk(id)
    .then((baca) => {
      if (baca) {
        res.render("baca", {
          title: "Baca Berita",
          berita: baca,
          comment1s: komentarr,
        });
      } else {
        // http 404 not found
        res.render("baca", {
          title: "Baca Berita",
          berita: {},
        });
      }
    })
    .catch((err) => {
      res.render("baca", {
        title: "Baca Berita",
        berita: {},
      });
    });
});

router.get("/deleteberita/:id", function (req, res, next) {
  var id = parseInt(req.params.id); // /detail/2, /detail/3
  Berita.destroy({
    where: { id: id },
  })
    .then((num) => {
      res.redirect("/berita");
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});

router.get("/editberita/:id", function (req, res, next) {
  const id = parseInt(req.params.id);
  Berita.findByPk(id)
    .then((berita) => {
      if (berita) {
        res.render("editberita", {
          title: "Edit Berita",
          berita: berita,
        });
      } else {
        // http 404 not found
        res.redirect("/berita");
      }
    })
    .catch((err) => {
      res.redirect("/editberita");
    });
});
router.post("/editberita/:id", kirim.array("gambar", 1), function (req, res, next) {
  const id = parseInt(req.params.id);
  let gambar = req.files[0].filename;
  let berita = {
    judul: req.body.judul,
    deskripsi: req.body.deskripsi,
    isi: req.body.isi,
    gambar: gambar,
  };
  Berita.update(berita, {
    where: { id: id },
  })
    .then((num) => {
      res.redirect("/berita");
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});

router.post("/comment", function (req, res, next) {
  let comment = {
    idberita: req.body.idberita,
    nama: req.body.nama,
    isi: req.body.isi,
  };
  Comment1s.create(comment)
    .then((data) => {
      res.redirect("/berita");
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});

router.post("/balas", function (req, res, next) {
  let comment1 = {
    idcomment: req.body.idcomment,
    nama1: req.body.nama1,
    balas: req.body.balas,
  };
  Comment2s.create(comment1)
    .then((data) => {
      res.redirect("/berita");
    })
    .catch((err) => {
      res.json({
        info: "Error",
        message: err.message,
      });
    });
});

// login & Register
router.get("/register", function (req, res, next) {
  res.render("register", { title: "Registrasi" });
});
router.post("/register", function (req, res, next) {
  var hashpass = bcrypt.hashSync(req.body.password, 8);
  var user = {
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: hashpass,
  };
  User.create(user)
    .then((data) => {
      res.redirect("/login");
    })
    .catch((err) => {
      res.redirect("/register");
    });
});

router.get("/login", function (req, res, next) {
  res.render("loginform", { title: "Login" });
});
router.post("/login", function (req, res, next) {
  User.findOne({ where: { username: req.body.username } })
    .then((data) => {
      console.log(loginValid);
      if (data) {
        var loginValid = bcrypt.compareSync(req.body.password, data.password);
        console.log(loginValid);
        if (loginValid) {
          // simpan session
          req.session.username = req.body.username;
          req.session.islogin = true;

          res.redirect("/berita");
        } else {
          res.redirect("/berita");
        }
      } else {
        res.redirect("/berita");
      }
    })
    .catch((err) => {
      res.redirect("/login");
    });
});

router.get("/logout", function (req, res, next) {
  req.session.destroy();
  res.redirect("/login");
});

module.exports = router;
