const axios = require('axios')
const parseStringAsArray = require('../utils/parseStringAsArray')
const { findConnections, sendMessage } = require('../websocket')

const Dev = require('../models/Dev')

module.exports = {
  async index (req, res) {
    const devs = await Dev.find()
    return res.json(devs)
  },
  async store (req, res) {
    const { github_username, techs, latitude, longitude } = req.body
        
    let dev = await Dev.findOne({ github_username })
    if (!dev) {
      const res_github = await axios.get(`https://api.github.com/users/${github_username}`)
   
      const {
        name = login,
        bio,
        avatar_url
      } = res_github.data

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      }

      const techsArray = parseStringAsArray(techs)

      dev = await Dev.create({
        github_username,
        name,
        bio,
        avatar_url,
        techs: techsArray,
        location
      })
      console.log('BUNDA');

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray
      )
      sendMessage(sendSocketMessageTo, 'new-dev', dev)
    }
    return res.json(dev)
  },
  async update (req, res) {
    const { id } = req.params
    const { name, bio, avatar_url, techs, latitude, longitude } = req.body

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    }

    const techsArray = parseStringAsArray(techs)

    const dev = await Dev.findOneAndUpdate(
      { _id: id },
      { $set: {
        name,
        bio,
        avatar_url,
        techs: techsArray,
        location
      }
      })

    return res.json(dev)
  },
  async destroy (req, res) {
    const { id } = req.params

    const result = await Dev.remove({ _id: id });

    const success = result.deletedCount === 1

    return res.json({ success })
  }
}