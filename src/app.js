require('dotenv').config();
const API_KEY = process.env.API_KEY;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const OWBaseURL = "http://api.openweathermap.org/data/2.5/weather";
const express = require('express');
const app = express();
const axios = require('axios');

app.use(express.json());
app.get('/songs',(req,res)=>{
    const reqParams = req.query;
    const axiosParams = {
        params:
        {
            q: reqParams.city, 
            units: "metric",
            appid: API_KEY
        }
    }
    if(reqParams.city){
        axios.get(OWBaseURL,axiosParams)
        .then((weatherData)=>{
            //res.send(weatherData.data.main);
            const temperature = weatherData.data.main.temp;
            const genre = genreLogic(temperature);
            (async function(){
                const token = await getToken();
                const playlistArray = await getPlaylistByGenre(token,genre);
                const randomId = Math.floor(Math.random()*playlistArray.length);
                const tracksEndpoint = playlistArray[randomId].tracks.href;
                const tracks = await getTracks(tracksEndpoint,token);
                const responseArray = [];
                for(let i =0 ; i < 10 ;i++){
                    responseArray.push(tracks[i].track.name);
                }
                res.send({tracks:responseArray, genre, temperature,playlist: playlistArray[randomId].name});
            })();
        })
        .catch((err)=>{
            console.log(err);
            res.status(400).send({err:"Invalid city"});
        })
    }
})

const getToken = async () => {
    const body = 'grant_type=client_credentials';
    const config = { 
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded', 
            'Authorization' : 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        }
    }
    const result = await axios.post('https://accounts.spotify.com/api/token',body,config);
    return result.data.access_token;
}

const getPlaylistByGenre = async (token, genreId) => {
    const limit = 10;
    const result = await axios.get(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, {
        headers: { 'Authorization' : 'Bearer ' + token}
    });
    return result.data.playlists.items
}

const getTracks = async (endpoint,token) => {
    const limit = 10;
    const config = {headers: {'Authorization': 'Bearer ' + token}};
    const result = await axios.get(`${endpoint}?limit=${limit}`,config);
    return result.data.items
}

const genreLogic = (temperature) =>{
    let genre;
    if(temperature >= 15 && temperature < 30) genre = 'pop';
    if(temperature >= 30) genre = 'party';
    if(temperature > 10 && temperature <= 14) genre = 'rock';
    if(temperature <= 10) genre = 'classical';
    return genre;
}

app.listen(3000,()=>{console.log('listening on 3000')})

