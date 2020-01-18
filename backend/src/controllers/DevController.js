const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const {findConnections, sendMessage} = require('../websocket');

module.exports = {
    async index(request, response) {
        const devs = await Dev.find();
        return response.json(devs);
    },

    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;

        let dev = await Dev.findOne({ github_username });

        if (!dev) {
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

            if (apiResponse) {

                const { name = login, avatar_url, bio } = apiResponse.data;

                const techsArray = parseStringAsArray(techs);

                const location = {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                };

                dev = await Dev.create({
                    github_username,
                    name,
                    avatar_url,
                    bio,
                    techs: techsArray,
                    location
                });

                const sendSocketMessageTo = findConnections(
                    { latitude, longitude }, techsArray
                )

                sendMessage(sendSocketMessageTo, 'new-dev', dev);
            } else {
                return response.json({ message: 'Usuário não existe!' })
            }
        }

        return response.json(dev);
    },

    async update(request, response) {
        const { github_username } = request.params;

        let dev = await Dev.findOne({ github_username });

        if (!dev) {
            return response.json({ message: 'Usuário não existe!' });
        } else {
            const { name, bio, avatar_url, longitude, latitude, techs } = request.body;

            const techsArray = parseStringAsArray(techs);

            const location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            }

            dev = await Dev.update({
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location
            })
        }

        return response.json({ message: 'Atualizando dev...' });
    },

    async delete(request, response) {
        const { github_username } = request.params;

        let dev = await Dev.findOneAndRemove({ github_username });

        if (!dev) {
            return response.json({ message: 'Usuário não existe!' });
        } else {
            return response.json({ message: 'Usuário deletado com sucesso!' });
        }
    }
};