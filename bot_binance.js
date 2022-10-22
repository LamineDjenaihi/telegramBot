require('dotenv').config({path: './sample.env'});
const { PORT, TELEGRAM_TOKEN, SERVER_URL, TINIFY_API_KEY } = process.env

const express = require('express')
const axios = require('axios')

// Telegram API Configuration
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`
const URI = `/webhook/${TELEGRAM_TOKEN}`
const webhookURL = `${SERVER_URL}${URI}`

// app initialization
const app = express()

// middlewares
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

// configuring the bot via Telegram API to use our route below as webhook
const setupWebhook = async () => {
    try {
        await axios.get(`${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`)
    } catch (error) {
        return error
    }
}

// Configuring the Binance API to get use it in our route 
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET,
    useServerTime: true
});


var volumes = new Array();
var timestampFix;

// setup our webhook url route
app.post(URI, async (req, res) => {
    const subscription = req.body;
    res.status(201).json({});
    await binance.websockets.candlesticks(['BTCUSDT'], "1m", function(candlesticks) {
        let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
        let { t:time, o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
        //.log(symbol+" "+interval+" candlestick update");
        //console.log("open: "+open);
        //console.log("high: "+high);
        //console.log("low: "+low);
        //console.log("close: "+close);
        let timestampChange = new Date(time).toLocaleString();// time is change every 5 min 
        if(timestampChange != timestampFix){
            console.log(symbol+" "+timestampChange+" volume: "+volume);
            volumes.push(volume);
            const payload = JSON.stringify({
                title: "New Value Volume",
                volume,
                timestampChange
            });

            console.log(symbol+" "+timestampChange+" volume: "+volume);
            timestampFix = timestampChange;
        }
        
        
    
});
    res.status(200).send('ok');
})

app.listen(PORT, async () => {
    // setting up our webhook url on server spinup
    try {
        console.log(`Server is up and Running at PORT : ${PORT}`)
        await setupWebhook()
    } catch (error) {
        console.log(error.message)
    }
})
