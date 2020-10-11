const express = require('express');
const jwt = require('jsonwebtoken');
const dataUsuarios = require('../data/usuarios');
const UsersController = require('../controllers/users');
require('dotenv').config()
const router = express.Router();
var passport = require('passport'); // Passport: Middleware de Node que facilita la autenticación de usuarios
const bcrypt = require('bcrypt');

//POST /api/auth/signin
router.post('/signin', async (req, res) => {

  const { dni, password } = req.body;
   
  if (!dni || !password) {
    return res.status(422).send({ error: 'Debe ingresar DNI y Password!' });
  }

  let usuario = await dataUsuarios.getUsuarioPorDNI(dni);
  usuario = usuario[0];
  console.log("Usuario: " + usuario);

  if(usuario == null) 
  {
    return res.status(422).send({ error: 'Password o DNI invalido!' });
  }

  // console.log("Pass: " + password);
  // console.log("User Pass: " + usuario.Password);
  // console.log("User Name: " + usuario.Nombre);

  //  if(password == usuario.Password)
  if(bcrypt.compareSync(password, usuario.Password)) 
  {
    const token = jwt.sign({ userId: usuario.DNI }, process.env.TokenKey);
    res.send({ token: token, 
      userId: usuario.DNI, 
      Nombre: usuario.Nombre,
      Email: usuario.Email,
      IdTipoDeUsuario: usuario.IdTipoDeUsuario,
      IdGerencia: usuario.IdGerencia
     });
  } else {
    return res.status(422).send({ error: 'Password o DNI invalido!' });
  }
});

//GET /api/auth/logout
router.get('/logout', async(req, res)=> {
  req.logout();
  res.redirect('/');
  return res.send({ token: "", userId: "" });
});

//POST /api/auth/signup
router.post('/signup', async (req, res) => {
  //Verifico si ya existe el usuario por su email
  // let usuario = await dataUsuarios.checkUsuario(req.body.email);

  // if(usuario != null) {
  //   return res.status(422).send({ error: 'El email ingresado ya se encuentra registrado!' });
  // } 

  // try
  // {
  //   let passwordCrypted = bcrypt.hashSync(req.body.password, 10);

  //   //console.log("REQ:" + JSON.stringify(req.body));

  //   const usuarioNuevo = {
  //       DNI: req.body.dni,
  //       password: passwordCrypted,
  //       nombre: req.body.nombre,
  //       email: req.body.email,
  //   }

  //   let usuarioPushed = await dataUsuarios.pushUsuario(usuarioNuevo)
  //   const token = jwt.sign({ userId: usuarioPushed.insertedId }, process.env.TokenKey);
  //   return res.send({ token: token, userId: usuarioPushed.insertedId });
  // }
  // catch ({ message }) 
  // {
  //   return res.status(422).send({error: 'Error al procesar la informacion: ' + message });
  // }

});

//POST /api/auth/providers - termino usando este endpoint para logeo/creacion desde providers
router.post('/providers', async (req, res) => {

  let usuario = await dataUsuarios.getUsuarioPorProvider(req.body.providerId,req.body.provider)
  if(usuario!= null) 
  {
    const token = jwt.sign({ userId: usuario._id }, process.env.TokenKey);
    return res.send({ token: token, userId: usuario._id });
  }
  
  let usuarioXemail = await dataUsuarios.getUsuarioPorEmail(req.body.email);
  if(usuarioXemail != null) {
    return res.status(422).send({ error: 'El email ingresado ya se encuentra registrado y no esta asociado a esta cuenta!' });
  } 
  
  const nuevoUsuario = {
        nombre: req.body.nombre,
        provider_id: req.body.providerId,
        provider: req.body.provider,
        email: req.body.email}

  let usuarioPushed = await dataUsuarios.pushUsuario(nuevoUsuario)
  const token = jwt.sign({ userId: usuarioPushed.insertedId }, process.env.TokenKey);
  return res.send({ token: token, userId: usuarioPushed.insertedId });
});

//GET /api/auth/test - ver usuarios
router.get('/test', async function(req, res, next) {
  let usuarios = await dataUsuarios.getUsuarios();
  res.send(usuarios);
});

module.exports = router;
