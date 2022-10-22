require('dotenv').config({path: './sample.env'});
const { PORT, TELEGRAM_TOKEN, SERVER_URL, TINIFY_API_KEY } = process.env

const express = require('express')
const axios = require('axios')
const qs = require('query-string')

// TinyPng Configuration
const tinify = require('tinify')
tinify.key = TINIFY_API_KEY

// Telegram API Configuration
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`
const URI = `/webhook/${TELEGRAM_TOKEN}`
const webhookURL = `${SERVER_URL}${URI}`

// app initialization
const app = express()

// middlewares
app.use(express.json())

// Returns URL from Tiny PNG after compressing the Image
const compressImage = async (bufferData) => {
     try {
          const { _url } = tinify.fromBuffer(bufferData)
          return await _url
     } catch (error) {
          return error
    }
}

// configuring the bot via Telegram API to use our route below as webhook
const setupWebhook = async () => {
    try {
        await axios.get(`${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`)
    } catch (error) {
        return error
    }
}

app.post(URI, async (req, res) => {
    try {
        const { message: { chat: { id }, document } } = req.body
        
        const errorMessageQuery = qs.stringify({
            text: `Please upload an Image`
        })

        if (!((document?.file_id ?? false) && ["image/png", "image/jpeg", "image/jpg"].includes(document.mime_type))) {
            await axios.post(`${TELEGRAM_API}/sendMessage?chat_id=${id}&${errorMessageQuery}`)
            return res.status(200).send('ok')
        }

        // Fetching File ID from Telegram's Server
        const getFileOptions = {
            url: `${TELEGRAM_API}/getFile?file_id=${document.file_id}`,
            method: 'GET',
        }
        const { data: { result: { file_path } } } = await axios(getFileOptions)

        // Fetching the File from the Telegram server as buffer 
        const telegramFileOptions = {
            url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file_path}`,
            method: 'GET',
            responseType: 'arraybuffer'
        }
        const { data } = await axios(telegramFileOptions)

        // Sending the compressed Image to the BOT using TinyPNG's URL
        const parsedQuery = qs.stringify({
            photo: `${await compressImage(data)}`,
            caption: `Your Compressed Image!`
        })
        const telegramSendImageOptions = {
               url: `${TELEGRAM_API}/sendPhoto?chat_id=${id}&${parsedQuery}`,
               method: "POST",
        }
          await axios(telegramSendImageOptions)

          res.status(200).send('ok')
     } catch (error) {
          console.log(error.message);
     }
})

app.listen(PORT, async () => {
     try {
          console.log(`Server is up and Running at PORT : ${PORT}`)
          await setupWebhook()
     } catch (error) {
     console.log(error.message)
    }
})
/*const TelegramBot = require('node-telegram-bot-api');
const token = process.env.BOT_TOKEN;;
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {

     var Hi = "hi";
     if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
     bot.sendMessage(msg.chat.id,"Hello dear @"+msg.from.first_name);
     }
     
     });*/