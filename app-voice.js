const config = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client();

require('dotenv').config({path: './.env'});

function removeUnusedChannels(categoryChannels) {
    let countChannels = categoryChannels.size;
    let emptyChannels = categoryChannels.filter((channel) => {
        return channel.members.size === 0;
    });
    let deletedIds = [];

    if (emptyChannels.size <= 1) {
        return deletedIds;
    }

    categoryChannels.some((channel) => {
        if (countChannels <= 1) {
            return true;
        }

        if (channel.members.size === 0) {
            deletedIds.push(channel.id);
            channel.delete();
            countChannels -= 1;
            return false;
        }
    });

    return deletedIds;
}

function setChannelsNames(categoryChannels) {
    let i = 0;

    categoryChannels.forEach((channel) => {
        let name = channel.name.split(' ')[0];

        i++;
        channel.setName(name + ' ' + i);
    });

    return i;
}

function addChannelToTheEndOfCategory(categoryChannels, emptyChannels, guild, i, category) {
    let lastChannel = categoryChannels.last();

    if (lastChannel.members.size >= 1 && emptyChannels.size <= 0) {
        let name = lastChannel.name.split(' ')[0];

        guild.createChannel(name + ' ' + (i + 1), {
            type: 'voice',
            parent: category,
            bitrate: lastChannel.bitrate * 1024,
            userLimit: lastChannel.userLimit,
            permissionOverwrites: lastChannel.permissionOverwrites
        });
    }
}

client.on('voiceStateUpdate', (oldMember) => {
    let guild = oldMember.guild;
    let processedCategories = guild.channels.filter((channel) => {
        return channel.type === 'category' && config.channelIds.indexOf(channel.id) >= 0;
    });

    processedCategories.forEach((category) => {
        let categoryChannels = guild.channels.filter((channel) => {
            return channel.parentID === category.id;
        });

        let deletedIds = removeUnusedChannels(categoryChannels);

        categoryChannels = categoryChannels.filter((channel) => {
            return deletedIds.indexOf(channel.id) < 0;
        });

        let emptyChannels = categoryChannels.filter((channel) => {
            return channel.members.size === 0;
        });

        let i = setChannelsNames(categoryChannels);

        addChannelToTheEndOfCategory(categoryChannels, emptyChannels, guild, i, category);
    });
});

client.login(process.env.DISCORD_VOICE_TOKEN);
