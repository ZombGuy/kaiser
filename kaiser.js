'use strict';
var Discord = require("discord.js");
var bot = new Discord.Client();
var fs = require('fs');

function saveState() {
  let curTime = new Date();
  if ((Date.now() - lastSave) > 30000) {
    let saveString = JSON.stringify(state);
    fs.writeFile('./save', saveString);
    console.log('save complete @ ' + (new Date()));
    lastSave = Date.now();
  }
}

function loadState() {
  var stateFile = './save';
  console.log('loading state');
  var data;
  try {
    data = fs.readFileSync(stateFile, 'utf8');
    state = JSON.parse(data);
  } 
  catch (e) {
    console.log('ERROR: Unable to load save file');
  }
  console.log('done loading');
}

var prefix = '%';
var state;
var lastSave = 0;

bot.on("message", msg => {
  //ignore all messages from bots
  if (msg.author.bot) {return;}
  console.log('message: ' + msg.content);  

  var guildID;
  var curName;
  var authorCanRunModCmds;
  var guildMember;
  if (msg.guild !== null) {
    guildID = msg.guild.id;
    guildMember = msg.guild.member(msg.author.id);
    curName = guildMember.nickname;
    if (curName === null) {
      curName = msg.author.username;
    }
    authorCanRunModCmds = guildMember.hasPermission('MANAGE_ROLES_OR_PERMISSIONS');
  } else {
    guildID = undefined;
    curName = msg.author.username;
    authorCanRunModCmds = false;
  }  
  
  var msgSrcType;
  var msgSrc;
  if (guildID === undefined) {
    msgSrcType = 'PM';
    msgSrc = msg.author;
  } else {
    msgSrcType = 'CHANNEL';
    msgSrc = msg.channel;
  }
  
  var roleName;
  var role;
  var guildOnlyCmds = {
    grantRole: true,
    revokeRole: true
  };
  var modOnlyCmds = {
  };
  if (msg.content.startsWith(prefix)) {
    let cmd = msg.content.substr(1).split(' ');
    if (modOnlyCmds[cmd] && !authorCanRunModCmds) {
      msgSrc.sendMessage('You are not authorized to run that command.');
      return;
    }
    if (guildOnlyCmds[cmd] && guildID === undefined) {
      msgSrc.sendMessage('That command does not work via direct message.');
      return;
    }
    //at this point the user is in the right place with the right permissions to run the cmd
    switch (cmd[0]) {
      case 'grantRole':
        roleName = cmd[1];
        role = msg.guild.roles.find('name', roleName);
        if (role) {
          guildMember.addRole(role).then((gm) => {
            msgSrc.sendMessage('Role added');
          }).catch((e) => {
            msgSrc.sendMessage('Failed to add role');
          });
        } else {
          msgSrc.sendMessage('Role does not exist. (check capitalization)');
        }
        break;
      case 'revokeRole':
        roleName = cmd[1];
        role = msg.guild.roles.find('name', roleName);
        if (role) {
          guildMember.removeRole(role).then((gm) => {
            msgSrc.sendMessage('Role removed');
          }).catch((e) => {
            msgSrc.sendMessage('Failed to add role');
          });
        } else {
          msgSrc.sendMessage('Role does not exist. (check capitalization)');
        }
        break;
      case 'help':
        var modStatusMsg;
        if (authorCanRunModCmds) {
          modStatusMsg = 'You can run moderator commands.';
        } else {
          modStatusMsg = 'You can NOT run moderator commands.';
        }
        msgSrc.sendMessage(`\`\`\`
kaiser handles roles.
(${modStatusMsg})
General commands:
 ${prefix}help - Display this help text
 ${prefix}grantRole <roleName> - add role <roleName> to issuer
 ${prefix}revokeRole <roleName> - remove role <roleName> from issuer
Moderator commands:
\`\`\`
Visit https://github.com/asteriskman7/kaiser for more information.
`);         
        break;
      default:
        msgSrc.sendMessage('Unknown command');
    }
  }

  saveState();
});

bot.on('ready', () => {
  console.log('I am ready!');
});

bot.on('error', e => { console.error(e); });

loadState();
if (state.botToken !== undefined && state.botToken.length > 0) {
  bot.login(state.botToken);
} else {
  console.log('ERROR: state.botToken is undefined or empty');
}

//add bot to server and give read messages/send messages/manage roles permissions
//https://discordapp.com/oauth2/authorize?client_id=<CLIENTID>&scope=bot&permissions=268438528
