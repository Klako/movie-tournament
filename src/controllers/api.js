const express = require('express');
const rooms = require('../models/room.js');
const profiles = require('../models/profile.js');
const errors = require('http-errors');
var exports = module.exports;

/**
 * @callback ApiHandler
 * @param {Request} req 
 * @param {Response} res 
 * @return {Promise<void>} 
 */

/**
 * Sends request to callback based on request method.
 * @param {Request} req 
 * @param {Response} res 
 * @param {Object.<string, ApiHandler} handlers 
 */
function handler(req, res, handlers) {
  if (handlers[req.method]) {
    handlers[req.method](req, res).catch((reason) => {
      console.log(reason.toString());
      if (reason.statusCode){
        res.status(reason.statusCode).json({ error: reason.message });
      } else {
        res.status(500).end();
      }
    });
  } else {
    res.status(405);
    res.json({ error: "Bad Method" });
  }
}

/**
 * 
 * @param {Response} res 
 * @param {import('http-errors').HttpError} reason 
 */
function doError(res, reason) {
  res.status(reason.statusCode).json({ error: reason.message });
}

exports.profile = function (req, res) {
  handler(req, res, {
    GET: async (req, res) => {
      await res.json(req.profile);
    },
    PATCH: async (req, res) => {
      var result = {};
      if (req.body.name) {
        await req.profile.setName(String(req.body.name));
        result.name = true;
      } else {
        result.name = false;
      }
      res.json(result);
    }
  })
}

exports.rooms = (req, res) => {
  handler(req, res, {
    POST: async (req, res) => {
      var roomId = await rooms.createRoom(req.body, req.profile.id);
      res.json({ url: "/room/" + roomId });
    }
  })
}

exports.room = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.id;
      if (rooms.roomExists(roomId)) {
        res.json({

        })
      } else {
        throw new errors[404]("Room does not exist");
      }
    }
  })
}

exports.movies = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      var result = await Promise.all(room.movies.map(async (movie) => ({
        id: movie.id,
        owner: (await profiles.get(movie.owner)).name
      })));
      await res.json(result);
      res.end();
    },
    POST: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      await room.addMovie(req.body.id, req.profile.id);
      await room.save();
      res.end();
    }
  })
}

exports.movie = (req, res) => {
  handler(req, res, {
    DELETE: async (req, res) => {
      var roomId = req.params.rid;
      var movieId = req.params.mid;
      rooms.getRoom(roomId).then((room) => {
        room.removeMovie(movieId);
        room.save().then(() => {
          res.end();
        }).catch((reason) => {
          doError(res, reason);
        })
      }).catch((reason) => {
        doError(res, reason);
      });
    }
  })
}

exports.roomUsers = (req, res) => {
  handler(req, res, {
    GET: async (req, res) => {
      var roomId = req.params.id;
      var room = await rooms.getRoom(roomId);
      res.json()
    }
  })
}

exports.roomUser = (req, res) => {
  handler(req, res, {
    DELETE: async (req, res) => {

    }
  })
}