const Discord = require('discord.js')
const bot = new Discord.Client()
const dotenv = require('dotenv')
const ytdl = require('ytdl-core')

// Get api key from environment variables
dotenv.config()

// prefix for commands
const prefix = '!'

bot.on('ready', async () => {
  console.log(`Logged in as ${bot.user.tag}!`)
  isReady = true
  commandLists = await getAudioCommands('./audio').catch(console.error)
  commandMap = commandLists[0]
  commonAudioCommands = commandLists[1]
});

bot.on('message', async (msg) => {
  // Check if the message is a command
  if (msg.content && msg.content[0] === prefix) {
    messageParts = msg.content.slice(1).split(' ')

    if (isReady) {
      isReady = false
      // get the correct voice channel
      const voiceChannel = msg.member.voice.channel

      if (voiceChannel) {
        let dispatcher
        if (messageParts[0] === 'play') {
          if (messageParts[0] && ytdl.validateURL(messageParts[1])) {
            const connection = await voiceChannel.join()
            dispater = connection.play(ytdl(messageParts[1], { filter: 'audioonly' }), { seek: 0, volume: 1 })
          } else {
            msg.channel.send('Not a valid youtube url')
          }
        } else {
          console.log('Did not recognize command ' + messageParts)
        }
      } else {
        const textChannel = msg.channel
        await textChannel.send('You are not in a voice channel')
      }

      isReady = true
    }
  }
})

bot.login(process.env.API_KEY)