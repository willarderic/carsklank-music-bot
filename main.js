const Discord = require('discord.js')
const dotenv = require('dotenv')
const ytdl = require('ytdl-core')

// Get api key from environment variables
dotenv.config()

// prefix for commands
const prefix = '!'

const client = new Discord.Client()

const queue = new Map()

client.once("ready", () => {
  console.log("Ready!")
})

client.once("reconnecting", () => {
  console.log("Reconnecting!")
})

client.once("disconnect", () => {
  console.log("Disconnect!")
})

client.on("message", async message => {
  if (message.author.bot) return
  if (!message.content.startsWith(prefix)) return

  const serverQueue = queue.get(message.guild.id)

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message, serverQueue);
    return
  } else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message, serverQueue);
    return
  } else {
    message.channel.send("You need to enter a valid command!")
  }
})

async function execute(message, serverQueue) {
  const args = message.content.split(" ")

  const voiceChannel = message.member.voice.channel
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    )
  const permissions = voiceChannel.permissionsFor(message.client.user)
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    )
  }

  if (!args[1]) {
    return message.channel.send('You must provide a URL!').catch(console.error)
  }

  const song = args[1]
  console.log(song)

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct)

    queueContruct.songs.push(song)

    try {
      var connection = await voiceChannel.join()
      queueContruct.connection = connection
      play(message.guild, queueContruct.songs[0])
    } catch (err) {
      console.log(err)
      queue.delete(message.guild.id)
      return message.channel.send(err)
    }
  } else {
    serverQueue.songs.push(song)
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    )

  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!")

  if (!serverQueue.connection.dispatcher)
    return

  serverQueue.connection.dispatcher.end()
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    )

  if (!serverQueue.connection.dispatcher)
    return

  serverQueue.songs = []
  serverQueue.connection.dispatcher.end()
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to pause the music!"
    )

  if (!serverQueue.connection.dispatcher)
    return

  serverQueue.connection.dispatcher.pause();
}

function resume(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to resume the music!"
    )
  if (!serverQueue.connection.dispatcher)
    return

  serverQueue.connection.dispatcher.resume()
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id)
  if (!song) {
    serverQueue.voiceChannel.leave()
    queue.delete(guild.id)
    return
  }
  const dispatcher = serverQueue.connection
    .play(ytdl(song, { filter: 'audioonly' }))
    .on("finish", () => {
      serverQueue.songs.shift()
      play(guild, serverQueue.songs[0])
    })
    .catch(error => {
      console.log('song: ' + song)
      console.error('This is the error: ' + error)
    })
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5)
}

client.login(process.env.API_KEY)