const Discord = require('discord.js');
const { prefix, token } = require('./config/config.json');
const client = new Discord.Client();
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const axios = require('axios');

async function getResponseDialogFlow(msg){
  const sessionId = uuid.v4();
  const sessionClient = new dialogflow.SessionsClient();
  const sessionPath = sessionClient.projectAgentSessionPath("searchananime-sjybxj", sessionId);
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: msg.content,
        languageCode: 'en-US',
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  console.log('Detected intent');
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
    if (msg.content === 'ping') {
      msg.reply('pong');
    }
  } else {
    console.log(`No intent matched.`);
  }
  return result;
}

function getUrlApi(intent){
  let api = "https://api.jikan.moe/v3/top";

  switch(intent){
    case "Top manga":
      return `${api + "/manga/1"}`;
    case "Top anime":
      return `${api + "/anime/1"}`;
    case "Top character":
      return `${api + "/characters/1"}`;
    default:
      return false;
  }
}

async function getTopManga(params){
  const url = getUrlApi(params.intent.displayName);

  if(url){
    return await new Promise(function(resolve, reject){
       axios.get(url)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        })
    })
  } else {
    return false;
  }
}

function parseData(data){
  const messageEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(data.title)
    .setImage(data.image_url)
    .setURL(data.url);

    return messageEmbed;
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', async message => {
  if(message.content.startsWith(prefix)){
    const responseDialogFlow = await getResponseDialogFlow(message);
    const data = await getTopManga(responseDialogFlow);

    if(data){
      for(let i = 0; i < data.top.length; i++){
        message.reply(parseData(data.top[i]));
      }
    } else {
      message.reply(responseDialogFlow.fulfillmentText)
    }
  }
})

client.login(token);