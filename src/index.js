const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

let player = createAudioPlayer();
let queue = [];
let isPlaying = false;
let isLooping = false;

client.player = player;

client.on(Events.ClientReady, async () => {
    console.log(`${client.user.tag} is ready`);
    
    client.user.setActivity(`Last Fragment`);

    const commands = [
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Réponds avec Pong!np'),
  
        new SlashCommandBuilder()
            .setName('dice')
            .setDescription('Lance un dé')
            .addNumberOption(option =>
                option
                .setName('nombre')
                .setDescription('Entre un nombre, s\'il te plaît')
                .setRequired(true)),

        new SlashCommandBuilder()
            .setName('piece')
            .setDescription('*Donnez une pièce à Balera*'),
        new SlashCommandBuilder()
            .setName('roulette')
            .setDescription('Lancer la Roulette'),
        new SlashCommandBuilder()
            .setName('play')
            .setDescription('Joue une musique.')
            .addStringOption(option =>
                option.setName('track')
                    .setDescription('Le nom de la piste à jouer')
                    .setRequired(true)),

        new SlashCommandBuilder()
            .setName('pause')
            .setDescription('Met en pause la musique actuelle.'),

        new SlashCommandBuilder()
            .setName('resume')
            .setDescription('Reprend la lecture de la musique.'),

         new SlashCommandBuilder()
            .setName('loop')
            .setDescription('Active ou désactive la répétition de la musique actuelle.'),
    
        new SlashCommandBuilder()
            .setName('skip')
            .setDescription('Passe à la prochaine musique dans la file d\'attente.'),
        
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Arrête la musique en cours, vide la file d\'attente et déconnecte le bot.'),
        
        new SlashCommandBuilder()
            .setName('mdice')
            .setDescription('Lancez plusieurs dés d\'un même type.')
            .addNumberOption(option =>
                option.setName('faces')
                    .setDescription('Nombre de faces')
                    .setRequired(true)
            )
            .addNumberOption(option =>
                option.setName('quantite')
                    .setDescription('Nombre de dés lancés (Max 20)')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('test')
            .setDescription('Test de commandes')
            .addNumberOption(option =>
                option.setName('test')
                    .setDescription('Test')
                    .setRequired(true)
            )
        ]
        try {
            await client.application.commands.set(commands);
            console.log('Enregistrement des commandes slash réussi.');
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement des commandes slash:', error);
        }
    });

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if(commandName==='ping'){
        interaction.reply('Pong !');
    }

    if(commandName==='roulette'){   
        function getRandomInt(max) {
            return Math.floor(Math.random() * max);
        }

        let retour = getRandomInt(102);
        retour -= 1;

        interaction.reply("La roulette tombe sur "+retour);
    }

    if(commandName==='dice'){
        function IsFloat(float){
            if(Math.floor(float) == float){
                return false;
            }
            else{
                return true;
            }
        }

        const Number = interaction.options.getNumber('nombre');

        if(isNaN(Number) || Number <= 1 || IsFloat(Number)){
            interaction.reply('Désolé... Mais votre numéro de dé est invalide...');
        }
        else{

            function getRandomInt(max) {
                return Math.floor(Math.random() * max);
            }

            const jet = getRandomInt(Number) + 1;

            if(jet == 1){
                interaction.reply('Désolé... Mais il semblerait que votre jet soit de **'+jet+'**, j\'espère que rien de grave ne vous arrivera...');
            }
            else if(jet == Number){
                interaction.reply('Votre jet est de **'+jet+'**, quelle sublime réussite !');
            }
            else{
                interaction.reply('Vous avez fait un jet de **'+jet+'/'+Number+'**.');
            }
        }
    }

    if(commandName==='test'){
        var piped = parseInt(interaction.options.getNumber('test'));

        interaction.reply(`${piped}`);
    }

    if(commandName==='mdice'){
        function IsFloat(float){
            if(Math.floor(float) == float){
                return false;
            }
            else{
                return true;
            }
        }
    
        const Number = interaction.options.getNumber('faces');
        const Quantite = interaction.options.getNumber('quantite');
        var string = "";

        

        if(isNaN(Number) || Number <= 1 || IsFloat(Number) || isNaN(Quantite) || Quantite <= 0 || IsFloat(Quantite)){
            interaction.reply('Désolé... Mais votre numéro de dé est invalide...');
        }
        else if(Quantite >= 20){
            interaction.reply('Je ne possède pas tant de dés, désolé...');
        }
        else{
            function getRandomInt(max) {
                return Math.floor(Math.random() * max);
            }

            for(let ii = 0; ii < Quantite; ii++){
                var jet = getRandomInt(Number) + 1;

                if(jet == 1){
                    string += 'Désolé... Mais il semblerait que votre jet n°'+(ii+1)+' soit de **'+jet+'**, j\'espère que rien de grave ne vous arrivera... \n';
                }
                else if(jet == Number){
                    string += 'Votre jet n°'+(ii+1)+' est de **'+jet+'**, quelle sublime réussite ! \n';
                }
                else{
                    string += 'Votre jet n°'+(ii+1)+' est de **'+jet+'/'+Number+'**. \n';
                }
            }

            interaction.reply(string)
        }
    }

    if(commandName==='piece'){
        interaction.reply('Merci ! Que la chance puisse être avec vous.');
    }

    if (commandName === 'play') {
        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'Vous devez être dans un salon vocal pour jouer de la musique !', ephemeral: true });
        }
        const musicName = interaction.options.getString('track');
        queue.push(musicName);
        await handleQueue(interaction);
    }
    
        switch (commandName) {
            case 'pause':
                if (isPlaying) {
                    player.pause();
                    interaction.reply('Musique mise en pause.');
                }
                break;
    
            case 'resume':
                if (player.state.status === AudioPlayerStatus.Paused) {
                    player.unpause(); // Reprendre la lecture
                    await interaction.reply('Reprise de la musique.');
                } else {
                    await interaction.reply('La musique n\'est pas en pause.');
                }
                break;
    
            case 'loop':
                isLooping = !isLooping;
                interaction.reply(`Répétition ${isLooping ? 'activée' : 'désactivée'}.`);
                break;
    
            case 'skip':
                if (queue.length > 1) {
                    queue.shift(); // Retirer la chanson actuelle de la file d'attente
                    playMusic(interaction, queue[0]); // Jouer la prochaine chanson
                    await interaction.reply('Musique suivante jouée.');
                } else {
                    await interaction.reply('Pas d\'autres chansons dans la file d\'attente.');
                }
                break;

            case 'stop':
                queue = [];
                isPlaying = false;
                isLooping = false;
                player.stop();
                {
                    const connection = getVoiceConnection(interaction.guild.id);
                    if (connection) {
                        connection.destroy();
                    }
                }
                await interaction.reply('Merci pour votre pièce, je me retire.');
                break;
        }

});

async function handleQueue(interaction) {
    if (!isPlaying) {
        isPlaying = true;
        await interaction.reply(`Préparation de la lecture de la chanson : ${queue[0]}`);
        playMusic(interaction, queue[0]);
    } else {
        await interaction.reply(`Chanson ajoutée à la file d'attente : ${queue[queue.length - 1]}`);
    }
}

function playMusic(interaction, musicName) {
    player.removeAllListeners();

    const musicDir = path.join(__dirname, 'music');
    let targetFile = null;
    try {
        const files = fs.readdirSync(musicDir);
        targetFile = files.find(file => file.toLowerCase() === `${musicName.toLowerCase()}.mp3`);
    } catch (err) {
        console.error('Erreur lors de la lecture du dossier de musique :', err);
    }

    if (!targetFile) {
        interaction.followUp(`Désolé, la musique "${musicName}" n'a pas été trouvée.`).catch(console.error);
        isPlaying = false;
        queue.shift();
        if (queue.length > 0) {
            playMusic(interaction, queue[0]);
        }
        return;
    }

    const filePath = path.join(musicDir, targetFile);
    const resource = createAudioResource(filePath);

    player.play(resource);
    
    let connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
            interaction.followUp('Impossible de se connecter au salon vocal (vous n\'êtes plus connecté à un salon).').catch(console.error);
            isPlaying = false;
            queue = [];
            return;
        }
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
    }

    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
        // Pas besoin d'envoyer un message ici car la réponse initiale a déjà été envoyée
    });

    player.on(AudioPlayerStatus.Idle, () => {
        if (isLooping) {
            playMusic(interaction, queue[0]);
        } else {
            isPlaying = false;
            if (queue.length > 1) {
                queue.shift();
                playMusic(interaction, queue[0]);
            } else if (queue.length === 1) {
                queue.shift();
                interaction.followUp('Fin de la liste de lecture.').catch(console.error);
                const activeConnection = getVoiceConnection(interaction.guild.id);
                if (activeConnection) {
                    activeConnection.destroy();
                }
            }
        }
    });

    player.on('error', error => {
        console.error(error);
        interaction.followUp('Une erreur est survenue lors de la lecture de la musique.').catch(console.error);
        isPlaying = false;
        queue = [];
        const activeConnection = getVoiceConnection(interaction.guild.id);
        if (activeConnection) {
            activeConnection.destroy();
        }
    });
}

client.login(process.env.TOKEN);

